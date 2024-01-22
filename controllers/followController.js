const User = require("../models/userModel");
const Follow = require("../models/followModel");

exports.follow = async (req, res) => {
  try {
    const { followingId } = req.body;
    const following = await User.findById(followingId);

    if (!following) {
      return res.status(404).json({ error: 'User not found!' })
    }

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: following._id
    });

    if (existingFollow) {
      return res
        .status(400)
        .json({ error: "Follow relationship already exists" });
    }

    const follow = new Follow({
      follower: req.user._id,
      following: following._id
    });

    await follow.save();

    res.status(201).json({ message: "Followed Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unfollow = async (req, res) => {
  try {
    const { followingId } = req.body;
    const following = await User.findById(followingId);

    if (!following) {
      return res.status(404).json({ error: 'User not found!' })
    }

    const existingFollow = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: following._id
    });

    if (!existingFollow) {
      return res
        .status(400)
        .json({ error: "Follow relationship does not exist" });
    }

    res.status(200).json({ message: "Unfollowed Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
