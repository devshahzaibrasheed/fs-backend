const User = require("../models/userModel");
const Block = require("../models/blockModel");
const Follow = require("../models/followModel");

exports.block = async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.status(404).json({ error: "userId is missing"})
    }

    const user = await User.findById(req.body.userId)
    if(!user) {
      return res.status(404).json({ error: "User not found"})
    }

    const existingBlock = await Block.findOne({blocked: user._id, blockedBy: req.user._id})
    if(existingBlock) {
      return res.status(400).json({ error: "User is already blocked"})
    }

    await Block.create({blocked: user._id, blockedBy: req.user._id})

    //remove following record if blocked
    await Follow.findOneAndDelete({ follower: user._id, following: req.user._id})
    await Follow.findOneAndDelete({ following: user._id, follower: req.user._id})

    res.status(200).json({ status: "success", message: 'User blocked succesfully!'})
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unblock = async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.status(400).json({ error: "userId is missing"})
    }

    const user = await User.findById(req.body.userId)
    if(!user) {
      return res.status(400).json({ error: "User not found"})
    }

    await Block.findOneAndDelete({blocked: user._id, blockedBy: req.user._id})

    res.status(200).json({ status: "success", message: 'User unblocked succesfully!'})
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.blockedUsers = async (req, res) => {
  try {
    const blockedUsers = await Block.find({ blockedBy: req.user._id })
      .populate("blocked", "firstName lastName image url useRealName displayName")
      .lean();

      blockedUsers.forEach(user => {
        if (user.blocked && user.blocked._id) {
          user.blocked.id = user.blocked._id.toString();
          user.blocked.username = user.blocked.userRealName ? `${user.blocked.firstName} ${user.blocked.lastName}` : user.blocked.displayName;
          delete user.blocked._id;
        }
      });

    res.status(200).json({ totalCount: blockedUsers.length, data: blockedUsers})
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
