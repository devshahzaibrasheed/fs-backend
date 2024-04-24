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
    content: String,
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", MessageSchema);
