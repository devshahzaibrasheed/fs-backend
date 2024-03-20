const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");

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
