const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { pagination } = require("../utils/pagination");

exports.getNotifications = async (req, res) => {
  try {
    const { page, per_page } = req.query;
    const { offset, limit } = pagination({ page, per_page });
    const notifications = await Notification.find({user: req.user._id})
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();;

    return res.status(200).json({ status: "success", data: notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.set(req.body);
    await notification.save();

    return res.status(200).json({ status: "success", data: notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ status: "success", message: 'Notification deleted succesfully!'});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id },
      { $set: { read: true } }
    );

    return res.status(200).json({ status: "success", message: "Notifications Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
