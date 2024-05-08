const User = require("../models/userModel");
const Video = require("../models/videoModel");

exports.create = async (req, res) => {
  try {
    const video = new Video(req.body);
    video.user = req.user._id;
    await video.save();

    res.status(200).json({ message: 'Video uploaded succesfully!', video: video })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const videos = await Video.find({ user: req.user._id });

    res.status(200).json({ total: videos.length, videos: videos })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if(!video) {
      return res.status(404).json({error: 'Video not found'})
    }

    res.status(200).json({ video})
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
