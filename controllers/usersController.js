const User = require("./../models/userModel");
const Follow = require("./../models/followModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

exports.getUsers = async (req, res) => {
  try {
    let filter = {};
    let searchFilter = {};

    const { role, status, plan, search } = req.query;

    //filters on role, status and plan
    if (role) filter.role = role;
    if (status) filter.userStatus = status;
    if (plan) filter.plan = plan;

    //search
    if (search) {
      searchFilter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { userStatus: { $regex: search, $options: "i" } },
        { plan: { $regex: search, $options: "i" } }
      ];
    }

    combinedFilter = { $and: [filter, searchFilter] };
    const users = await User.find(combinedFilter);

    return res.status(200).json({status: "success", total: users.length, data: users });
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
    const user = await User.findOne({url: req.params.url.toLowerCase()});

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
    await Notification.deleteMany({$or: [{ user: user._id }, { senderId: user._id }]});

    res.status(200).json({ status: "success", message: 'Account Delete succesfully!'});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBulkUsers = async (req, res) => {
  try {
    const { userIDs } = req.body;
    const deleteResult = await User.deleteMany({ _id: { $in: userIDs } });

    if (deleteResult.deletedCount > 0) {
      await Follow.deleteMany({
        $or: [{ follower: { $in: userIDs } }, { following: { $in: userIDs } }]
      });
      await Notification.deleteMany({$or: [{ user: { $in: userIDs } }, { senderId: { $in: userIDs } }]});

      res.status(200).json({ message: "Users deleted successfully" });
    } else {
      res.status(404).json({ message: "No users found for deletion" });
    }
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

exports.metaData = async (req, res) => {
  try {
    const accounts = await User.countDocuments();
    const subscribers = await User.countDocuments({ plan: { $in: ["pro_monthly", "pro_annually"] } });
    const online = await User.countDocuments();
    const verified = await User.countDocuments({ idVerified: true });

    res.status(200).json({ message: "success", data: { accounts, subscribers, online, verified} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportUsers = async (req, res, next) => {
  const users = await User.find();
  const selectedFields = [
    "firstName",
    "lastName",
    "email",
    "role",
    "userStatus",
    "plan",
  ];

  const tempDir = path.join(os.tmpdir(), "csv_exports");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  const csvFilePath = path.join(tempDir, "users.csv");

  const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: selectedFields.map((field) => ({
      id: field,
      title: field.charAt(0).toUpperCase() + field.slice(1),
    })),
  });

  const selectedUsers = users.map((user) => {
    const selectedUser = {};
    selectedFields.forEach((field) => {
      selectedUser[field] = user[field];
    });
    return selectedUser;
  });

  csvWriter
    .writeRecords(selectedUsers)
    .then(() => {
      console.log("CSV file created successfully");
      res.sendFile(csvFilePath, {
        headers: {
          "Content-Disposition": `attachment; filename=users.csv`,
        },
      });
    })
    .catch((error) => {
      console.error("Error creating CSV file:", error);
      res.status(500).send("Internal Server Error");
    });
};

exports.createUser = async (req, res) => {
  try {
    const url = crypto.randomBytes(8).toString("hex");
    const user = new User({
      ...req.body,
      url: url,
      joinedDate: new Date(),
    });

    await user.save();

    res.status(201).json({ message: "User added successfully", data: user });
  } catch (error) {
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.email === 1
    ) {
      return res.status(422).json({
        error: "Email already exist"
      });
    }

    res.status(422).json({ error: error.message });
  }
};
