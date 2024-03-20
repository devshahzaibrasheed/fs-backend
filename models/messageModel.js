const mongoose = require("mongoose");
const { Schema } = mongoose;
const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation"
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    content: String
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", MessageSchema);
