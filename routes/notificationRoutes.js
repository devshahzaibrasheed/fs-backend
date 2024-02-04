const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationsController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .get("/", notificationController.getNotifications)
  .patch("/mark_read", notificationController.markAsRead)
  .patch("/:id", notificationController.updateNotification)
  .delete("/:id", notificationController.deleteNotification)

module.exports = router;
