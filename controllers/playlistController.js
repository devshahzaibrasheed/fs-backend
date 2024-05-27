const User = require("../models/userModel");
const Playlist = require("../models/playlistModel");
const Video = require("../models/videoModel");

exports.create = async (req, res) => {
  try {
    const existing = await Playlist.findOne({ user: req.user._id, title: req.body.title })
    if(existing) {
      return res.status(422).json({ error: 'Another Playlist with this name already exists'})
    }
    
    const list = new Playlist(req.body);
    list.user = req.user._id;
    await list.save();

    res.status(200).json({ message: 'Playlist added succesfully!', playlist: list })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const query = req.query.type === "all" ? { user: req.params.id } : { user: req.params.id, visibility: "public" };
    const playlists = await Playlist.find({ user: req.params.id }).sort({ createdAt: -1 });

    //include videos count of each playlist
    const data = await Promise.all(playlists.map(async (playlist) => {
      return {
        ...playlist.toObject(),
        videosCount: await Video.countDocuments({ playlists: { $in: [playlist._id] }, privacy: 'public'})
      };
    }));

    res.status(200).json({ playlists: data })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPlaylistVideos = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if(!playlist) {
      return res.status(404).json({ error: 'Playlist not found!'})
    }

    const videos = await Video.find({ playlists: { $in: [playlist._id] }});
    const playlistWithVideos = { ...playlist.toObject(), videos, videosCount: videos.length };

    res.status(200).json({ data: playlistWithVideos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

