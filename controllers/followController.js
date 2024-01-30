const User = require("../models/userModel");
const Follow = require("../models/followModel");

exports.follow = async (req, res) => {
  try {
    const { followingId } = req.body;
    const user = await User.findById(followingId);

    if (!user) {
      return res.status(404).json({ error: 'User not found!' })
    }

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: user._id
    });

    if (existingFollow) {
      return res
        .status(400)
        .json({ error: "Follow relationship already exists" });
    }

    const follow = new Follow({
      follower: req.user._id,
      following: user._id
    });

    await follow.save();

    //whether current user is following this user or not
    const is_following = await Follow.findOne({
      follower: req.user._id,
      following: user._id
    });

    //number of followers
    const followers_count = await Follow.countDocuments({
      following: req.user._id
    });

    //whether current user is followed by this user or not
    const is_follower = await Follow.findOne({
      follower: user._id,
      following: req.user._id
    });

    //number of followings
    const followings_count = await Follow.countDocuments({
      follower: req.user._id
    });

    let following = is_following ? true : false;
    let follower = is_follower ? true : false;

    const modifiedUser = {
      ...user.toObject(),
      following,
      follower,
      followers_count,
      followings_count
    };

    res.status(201).json({ message: "Followed Successfully", user: modifiedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unfollow = async (req, res) => {
  try {
    const { followingId } = req.body;
    const user = await User.findById(followingId);

    if (!user) {
      return res.status(404).json({ error: 'User not found!' })
    }

    const existingFollow = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: user._id
    });

    if (!existingFollow) {
      return res
        .status(400)
        .json({ error: "Follow relationship does not exist" });
    }

    //whether current user is following this user or not
    const is_following = await Follow.findOne({
      follower: req.user._id,
      following: user._id
    });

    //number of followers
    const followers_count = await Follow.countDocuments({
      following: req.user._id
    });

    //whether current user is followed by this user or not
    const is_follower = await Follow.findOne({
      follower: user._id,
      following: req.user._id
    });

    //number of followings
    const followings_count = await Follow.countDocuments({
      follower: req.user._id
    });

    let following = is_following ? true : false;
    let follower = is_follower ? true : false;

    const modifiedUser = {
      ...user.toObject(),
      following,
      follower,
      followers_count,
      followings_count
    };

    res.status(200).json({ message: "Unfollowed Successfully", user: modifiedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
