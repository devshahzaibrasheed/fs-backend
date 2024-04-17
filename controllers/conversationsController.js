const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const { pagination } = require("../utils/pagination");

exports.createConversation = async (req, res) => {
  try {
    const { conversationType, members } = req.body;
    let conversation;

    if (conversationType === 'individual') {
      conversation = await Conversation.findOne({ 
        members: { $all: members }, 
        conversationType: "individual" 
      });
    };

    if (!conversation) {
      const newConversation = new Conversation({
        members,
        conversationType,
        createdBy: req.user._id,
      });

      await newConversation.save();
      conversation = newConversation;
    }
    
    await conversation.populate('members', 'firstName lastName useRealName displayName image url');
    const recipient = conversation.members.find(member => member._id.toString() !== req.user._id.toString());
    conversation.conversationTitle = recipient.useRealName ? `${recipient.firstName} ${recipient.lastName}` : recipient.displayName;
    conversation.conversationAvatar = recipient.image || "";

    res.status(200).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { page, per_page } = req.query;
    const { offset, limit } = pagination({ page, per_page });
    const type = req.query.type;

    if (!user) {
      return res.status(404).json({ error: 'User not found!' })
    }

    const pin = type === "pinned" ? { $in: [req.params.id] } : { $nin: [req.params.id]}

    let query = type === "all" ? {
      members: { $in: [req.params.id] },
      $or: [
        { "messagesTrack": { $exists: false } },
        { 
          "messagesTrack": { 
            $elemMatch: { 
              userId: req.params.id,
              $or: [
                { deleted: false },
                { deleted: { $exists: false } }
              ]
            }
          }
        }
      ]
    } : {
      members: { $in: [req.params.id] },
      pinnedBy: pin,
      $or: [
        { "messagesTrack": { $exists: false } },
        { 
          "messagesTrack": { 
            $elemMatch: { 
              userId: req.params.id,
              $or: [
                { deleted: false },
                { deleted: { $exists: false } }
              ]
            }
          }
        }
      ]
    }

    const conversations = await Conversation.find(query)
      .populate({
        path: "members",
        select: "firstName lastName useRealName image url displayName activityStatus recentActivity"
      })
      .populate({
        path: "lastMessage",
        select: "content createdAt"
      })
      .select("-__v")
      .sort({ lastMessage: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

      for (const conversation of conversations) {
        if (conversation.conversationType === 'individual') {
          const recipient = conversation.members.find(member => member._id.toString() !== req.user._id.toString());
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          conversation.conversationTitle = recipient.useRealName ? `${recipient.firstName} ${recipient.lastName}` : recipient.displayName;
          conversation.conversationAvatar = recipient.image || "";
          conversation.activityStatus = recipient.activityStatus;
          conversation.online = recipient.recentActivity && recipient.recentActivity.onlineAt && recipient.recentActivity.onlineAt >= fiveMinutesAgo ? true : false;
          conversation.pin = type === "pinned" ? true : false;
        }
        //unread messages
        let unreadMessageCount = 0;
        const record = conversation?.messagesTrack?.find(
          (track) => track.userId && track.userId.toString() === req.user._id.toString()
        );

        if (record) {
          const lastMessageSeen = await Message.findById(record.lastMessageSeen);
          if (lastMessageSeen) {
            unreadMessageCount = await Message.countDocuments({
              conversation: conversation._id,
              createdAt: { $gt: lastMessageSeen.createdAt }
            });
          } else {
            unreadMessageCount = await Message.countDocuments({ conversation: conversation._id });
          }
        } else {
          unreadMessageCount = await Message.countDocuments({ conversation: conversation._id });
        }
        conversation.unreadMessageCount = unreadMessageCount;
    };

    //total pages
    const count = await Conversation.countDocuments(query);
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ conversations: conversations, page: parseInt(page, 10) || 1, per_page: parseInt(per_page, 10) || 10, totalPages });

  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conversation.members.includes(req.user.id)) {
      const deletedByUserIndex = conversation.messagesTrack.findIndex(track => track.userId.equals(req.user.id));
      if (deletedByUserIndex !== -1) {
        conversation.messagesTrack[deletedByUserIndex].deletedAt = new Date();
        conversation.messagesTrack[deletedByUserIndex].deleted = true;
      } else {
        conversation.messagesTrack.push({ user_id: req.user.id, deletedAt: new Date(), deleted: true });
      }

      await conversation.save();
      return res.status(200).json({ message: "Conversation deleted successfully" });
    } else {
      return res.status(403).json({ error: "You are not authorized to delete this conversation" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.readConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const latestMessage = await Message.findOne({conversation: conversation._id})
    .sort({ createdAt: -1 })

    const existingTrackIndex = conversation.messagesTrack.findIndex(
      (existing) => existing.userId.toString() === req.user._id.toString()
    );

    if (existingTrackIndex !== -1) {
      conversation.messagesTrack[existingTrackIndex].lastMessageSeen = latestMessage._id;
    } else {
      conversation.messagesTrack.push({
        userId: req.user._id,
        lastMessageSeen: latestMessage._id
      });
    }

    await conversation.save();
    res.status(200).json({ message: "Conversation read successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pinConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Check if the conversation is already pinned
    if (conversation.pinnedBy.includes(req.user._id)) {
      return res.status(400).json({ error: 'User already pinned this conversation' });
    }

    // Add the current user to the pinnedBy array
    conversation.pinnedBy.push(req.user._id);
    await conversation.save();

    res.status(200).json({ message: "Conversation pinned successfully", conversation: conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unpinConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Remove the current user ID from the pinnedBy array
    conversation.pinnedBy = conversation.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
    await conversation.save();

    res.status(200).json({ message: "Conversation unpinned successfully", conversation: conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
