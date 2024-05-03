const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectID,
      ref: "User"
    },
    title: String,
    videoUrl: String,
    thumbnailUrl: String,
    description: String,
    country: String,
    playlist: String,
    category: String,
    tags: [
      {
        type: String
      }
    ],
    privacy: {
      type: String,
      enum: ["public", "private"]
    },
    status: {
      type: String,
      enum: ["published", "draft"]
    }
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;
