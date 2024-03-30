const mongoose = require("mongoose");
const { Schema } = mongoose;
const ConversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: Schema.Types.ObjectID,
        ref: "User"
      }
    ],
    messagesTrack: [
      {
        userId: {
          type: Schema.Types.ObjectID,
          ref: "User"
        },
        lastMessageSeen: {
          type: Schema.Types.ObjectID,
          ref: "Message"
        }
      }
    ],
    conversationType: {
      type: String,
      enum: ["individual", "group"],
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message"
    },
    conversationTitle: String,
    conversationAvatar: String
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
