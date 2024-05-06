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
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"]
    },
    videoOrder: {
      type: String,
      enum: ["date_published_newest", "date_published_oldest", "date_added_newest", "date_added_oldest", "popular", "manual"]
    }
  },
  {
    timestamps: true,
  }
);

const Playlist = mongoose.model("Playlist", playlistSchema);
module.exports = Playlist;
