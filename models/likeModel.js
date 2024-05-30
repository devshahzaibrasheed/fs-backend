const mongoose = require("mongoose");
const { Schema } = mongoose;

const likeSchema = new mongoose.Schema(
  {
    likedBy: {
      type: Schema.Types.ObjectID,
      ref: "User"
    },
    resourceId: String,
    resourceType: String
  },
  {
    timestamps: true,
  }
);

const Like = mongoose.model("Like", likeSchema);
module.exports = Like;
