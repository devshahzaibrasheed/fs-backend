const User = require("../models/userModel");
const Follow = require("../models/followModel");
const Notification = require("../models/notificationModel");
const Conversation = require("../models/conversationModel");
const { pagination } = require("../utils/pagination");

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

    //existing chat
    const conversation = await Conversation.findOne({ 
      members: { $all: [req.user._id, user._id] }, 
      conversationType: "individual" 
    });

    const modifiedUser = {
      ...user.toObject(),
      following,
      follower,
      followers_count,
      followings_count,
      conversationId: conversation ? conversation._id : null
    };

    //Create a notification
    const text = is_follower ? "Has followed you back" : "Has followed you";
    await Notification.create({user: user._id, type: 'follow', senderId: req.user._id, details: {text: text , follower_id: req.user._id}});

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

    //existing chat
    const conversation = await Conversation.findOne({ 
      members: { $all: [req.user._id, user._id] }, 
      conversationType: "individual" 
    });

    const modifiedUser = {
      ...user.toObject(),
      following,
      follower,
      followers_count,
      followings_count,
      conversationId: conversation ? conversation._id : null
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

          const followersCount = await Follow.countDocuments({
            following: follower._id
          });
      
          return {
            ...follower,
            status: isFriend ? 'Friends' : 'Follow Back',
            name: follower.useRealName ? `${follower.firstName} ${follower.lastName}` : follower.displayName,
            followersCount
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

          const followersCount = await Follow.countDocuments({
            following: following._id
          });

          return {
            ...following,
            status: isFriend ? 'Friends' : 'Following',
            name: following.useRealName ? `${following.firstName} ${following.lastName}` : following.displayName,
            followersCount
          };
        })
      );

    const totalFollowing = following.length;

    res.status(200).json({ totalFollowing, following: followingList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFriends = async(req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { page, per_page } = req.query;
    const { offset, limit } = pagination({ page, per_page });

    if (!user) {
      return res.status(404).json({ error: 'User not found!' })
    }

    const following = await Follow.find({ follower: user._id });
    const followingUserIds = following.map(follow => follow.following);

    //total pages
    const count = await Follow.countDocuments({
      following: user._id,
      follower: { $in: followingUserIds }
    });
    const totalPages = Math.ceil(count / limit);

    // Find users who are following the specific user and are also being followed by the specific user
    const mutualFollowers = await Follow.find({
      following: user._id,
      follower: { $in: followingUserIds }
    })
    .populate("follower", "firstName lastName image url useRealName displayName activityStatus recentActivity")
    .select("-_id -following -__v")
    .limit(limit)
    .skip(offset);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const users = await Promise.all(mutualFollowers.map(async ({ follower }) => {
      const conversation = await Conversation.findOne({ 
        members: { $all: [req.user._id, follower._id] }, 
        conversationType: "individual" 
      });
      
      return {
        _id: follower._id,
        fullName: follower.useRealName ? `${follower.firstName} ${follower.lastName}` : follower.displayName,
        image: follower.image || '',
        url: follower.url || '',
        activityStatus: follower.activityStatus,
        online: follower.recentActivity && follower.recentActivity.onlineAt && follower.recentActivity.onlineAt >= fiveMinutesAgo ? true : false,
        conversationId: conversation ? conversation._id : null
      };
    }));

    res.status(200).json({ users: users, page: parseInt(page, 10) || 1, per_page: parseInt(per_page, 10) || 10, totalPages });

  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};
