const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new mongoose.Schema(
  {
    commentBy: {
      type: Schema.Types.ObjectID,
      ref: "User"
    },
    text: String,
    resourceId: String,
    resourceType: String,
    parentId: {
      type: Schema.Types.ObjectID,
      ref: "Comment"
    }
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
