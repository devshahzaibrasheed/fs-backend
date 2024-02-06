const User = require("../models/userModel");
const Follow = require("../models/followModel");
const Notification = require("../models/notificationModel");

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
      following: user._id
    });

    //whether current user is followed by this user or not
    const is_follower = await Follow.findOne({
      follower: user._id,
      following: req.user._id
    });

    //number of followings
    const followings_count = await Follow.countDocuments({
      follower: user._id
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

    //Create a notification
    const follower_name = req.user.useRealName ? `${req.user.firstName} ${req.user.lastName}` : req.user.displayName;
    const text = is_follower ? "Has followed you back" : "Has followed you";
    const {url, image, _id} = req.user;
    await Notification.create({user: user._id, details: {text: text, follower_name: follower_name, follower_id: _id, follower_image: image, follower_url: url}});

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
      following: user._id
    });

    //whether current user is followed by this user or not
    const is_follower = await Follow.findOne({
      follower: user._id,
      following: req.user._id
    });

    //number of followings
    const followings_count = await Follow.countDocuments({
      follower: user._id
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

exports.removeFollower = async (req, res) => {
  try {
    const { followerId } = req.body;
    const user = await User.findById(followerId);

    if (!user) {
      return res.status(404).json({ error: 'Follower not found!' })
    }

    const existingFollower = await Follow.findOneAndDelete({
      follower: user._id,
      following: req.user._id
    });

    if (!existingFollower) {
      return res
        .status(400)
        .json({ error: "Follow relationship does not exist" });
    }

    res.status(200).json({ message: "Follower removed Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found!' })
    }

    const followers = await Follow.find({ following: user._id })
      .populate("follower", "firstName lastName image url useRealName displayName")
      .lean();

      //if the user is also following back then friends else follow back
      const followerList = await Promise.all(
        followers.map(async ({ follower }) => {
          const isFriend = await Follow.findOne({
            follower: user._id,
            following: follower._id,
          });
      
          return {
            ...follower,
            status: isFriend ? 'Friends' : 'Follow Back',
            name: follower.useRealName ? `${follower.firstName} ${follower.lastName}` : follower.displayName
          };
        })
      );
    const totalFollowers = followers.length;

    res.status(200).json({ totalFollowers, followers: followerList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found!' })
    }

    const following = await Follow.find({ follower: user._id })
      .populate("following", "firstName lastName image url useRealName displayName")
      .lean();

      //if the other user is also following then friends else following
      const followingList = await Promise.all(
        following.map(async ({ following }) => {
          const isFriend = await Follow.findOne({
            follower: following._id,
            following: user._id,
          });

          return {
            ...following,
            status: isFriend ? 'Friends' : 'Following',
            name: following.useRealName ? `${following.firstName} ${following.lastName}` : following.displayName
          };
        })
      );

    const totalFollowing = following.length;

    res.status(200).json({ totalFollowing, following: followingList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
