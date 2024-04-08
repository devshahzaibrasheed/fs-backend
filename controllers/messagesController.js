const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");
const { pagination } = require("../utils/pagination");

exports.createMessage = async (req, res) => {
  try {
    const { content, sender } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found!' })
    }

    const message = new Message({
      content,
      conversation: conversation._id,
      sender
    });

    await message.save();
    conversation.lastMessage = message._id;

    const existingTrackIndex = conversation.messagesTrack.findIndex(
      (existing) => existing.userId.toString() === req.user._id.toString()
    );

    if (existingTrackIndex !== -1) {
      conversation.messagesTrack[existingTrackIndex].lastMessageSeen = message._id;
    } else {
      conversation.messagesTrack.push({
        userId: req.user._id,
        lastMessageSeen: message._id
      });
    }

    conversation.messagesTrack.forEach(track => {
      track.deleted = false; 
    });

    await conversation.save();
    await message.populate('sender', 'firstName lastName useRealName displayName image url');

    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    let conversation = await Conversation.findById(req.params.id);
    const { page, per_page } = req.query;
    const { offset, limit } = pagination({ page, per_page });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found!' })
    }

    const wasDeleted = conversation.messagesTrack.find((track) =>
      track.userId.equals(req.user._id) && track.deletedAt
    );
    let query = wasDeleted ? {conversation: conversation._id, createdAt: { $gt: wasDeleted.deletedAt }} : {conversation: conversation._id}

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .populate('sender', 'image')
      .skip(offset)
      .limit(limit)

    //total pages
    const count = await Message.countDocuments({conversation: conversation._id});
    const totalPages = Math.ceil(count / limit);

    //keep track of last read message by user
    const existingTrackIndex = conversation.messagesTrack.findIndex(
      (existing) => existing.userId.toString() === req.user._id.toString()
    );

    if (existingTrackIndex !== -1) {
      conversation.messagesTrack[existingTrackIndex].lastMessageSeen = messages[0]._id;
    } else {
      conversation.messagesTrack.push({
        userId: req.user._id,
        lastMessageSeen: messages[0]._id
      });
    }
    conversation = await conversation.save();
    ////

    res.status(200).json({ messages: messages.reverse() , page: parseInt(page, 10) || 1, per_page: parseInt(per_page, 10) || 10, totalPages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
