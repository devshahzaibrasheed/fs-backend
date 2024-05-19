const User = require("../models/userModel");
const Video = require("../models/videoModel");
const Follow = require("../models/followModel");
const { pagination } = require("../utils/pagination");

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
    const videos = await Video.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({ total: videos.length, videos: videos })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.allVideos = async (req, res) => {
  try {
    const { page, per_page } = req.query;
    const { offset, limit } = pagination({ page, per_page });

    const videos = await Video.find()
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

    //total pages
    const count = await Video.countDocuments();
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({ page: parseInt(page, 10) || 1, per_page: parseInt(per_page, 10) || 10, totalPages: totalPages, videos: videos })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("user", "firstName lastName image url useRealName displayName userStatus")
      .lean();

    if (!video) {
      return res.status(404).json({ error: 'Video not found!' })
    }

    video.user.followersCount = await Follow.countDocuments({ following: video.user._id });
    video.user.videosCount = await Video.countDocuments({ user: video.user._id });
    video.user.username = video.user.useRealName ? `${video.user.firstName} ${video.user.lastName}` : video.user.displayName;

    res.status(200).json({ video})
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
