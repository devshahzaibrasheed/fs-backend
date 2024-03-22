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

    if (!user) {
      return res.status(404).json({ error: 'User not found!' })
    }

    let query = { members: { $in: [req.params.id] } }; 
    const conversations = await Conversation.find(query)
      .populate({
        path: "members",
        select: "firstName lastName useRealName image url displayName"
      })
      .populate({
        path: "lastMessage",
        select: "content createdAt"
      })
      .select("-messagesTrack -__v")
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    conversations.forEach(conversation => {
      conversation.members.forEach(member => {
        member.recipient = member._id.toString() !== req.user._id.toString();
        member.fullName = member.useRealName ? `${member.firstName} ${member.lastName}` : member.displayName;
      });
    });

    //total pages
    const count = await Conversation.countDocuments(query);
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ conversations: conversations, page: parseInt(page, 10) || 1, per_page: parseInt(per_page, 10) || 10, totalPages });

  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};
