const User = require("./../models/userModel");
const Follow = require("./../models/followModel");
const jwt = require("jsonwebtoken");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();

    return res.status(200).json({status: "success", data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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

    return res.status(200).json({status: "success", data: modifiedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserByUrl = async (req, res) => {
  try {
    const user = await User.findOne({url: req.params.url});

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //number of followings
    const followings_count = await Follow.countDocuments({
      follower: user._id
    });

    //number of followers
    const followers_count = await Follow.countDocuments({
      following: user._id
    });

    if(!req.headers.authorization) {
      const publicUser = {
        ...user.toObject(),
        followers_count,
        followings_count
      };

      return res.status(200).json({status: "success", data: publicUser });
    }

    let token = req.headers.authorization;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const current_user = await User.findById(decoded.id);

    //whether current user is following this user or not
    const is_following = await Follow.findOne({
      follower: current_user._id,
      following: user._id
    });

    //whether current user is followed by this user or not
    const is_follower = await Follow.findOne({
      follower: user._id,
      following: current_user._id
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

    return res.status(200).json({status: "success", data: modifiedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.set(req.body);
    await user.save();

    res.status(200).json({ message: "success", data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await Follow.deleteMany({
      $or: [{ follower: user._id }, { following: user._id }]
    });
    await Notification.deleteMany({user: user._id});

    res.status(200).json({ status: "success", message: 'Account Delete succesfully!'});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { key } = req.query;

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { firstName: { $regex: key, $options: "i" } },
        { lastName: { $regex: key, $options: "i" } },
        { email: { $regex: key, $options: "i" } },
        { displayName: { $regex: key, $options: "i" }}
      ],
    });

    res.status(200).json({
      results: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};