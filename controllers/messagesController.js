const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");

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
    await conversation.save();
    await message.populate('sender', 'firstName lastName useRealName displayName image url');

    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
}
};
