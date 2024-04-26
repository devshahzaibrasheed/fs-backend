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
        },
        deleted: { 
          type: Boolean,
          default: false
        },
        deletedAt: Date
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
    state: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending"
    },
    conversationTitle: String,
    conversationAvatar: String,
    pinnedBy: [
      {
        type: Schema.Types.ObjectID,
        ref: "User"
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
