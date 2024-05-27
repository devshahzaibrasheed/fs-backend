const mongoose = require("mongoose");
const { Schema } = mongoose;

const playlistSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectID,
      ref: "User"
    },
    title: String,
    description: String,
    thumbnailUrl: String,
    visibility: {
      type: String,
      enum: ["public", "private"]
    }
  },
  {
    timestamps: true,
  }
);

const Playlist = mongoose.model("Playlist", playlistSchema);
module.exports = Playlist;
