const express = require("express");
const router = express.Router();

const conversationController = require("../controllers/conversationsController");
const messageController = require("../controllers/messagesController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .post("/", conversationController.createConversation)
  .post("/:id/messages", messageController.createMessage)

module.exports = router;
