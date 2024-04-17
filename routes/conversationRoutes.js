const express = require("express");
const router = express.Router();

const conversationController = require("../controllers/conversationsController");
const messageController = require("../controllers/messagesController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .post("/", conversationController.createConversation)
  .post("/:id/read", conversationController.readConversation)
  .post("/:id/pin", conversationController.pinConversation)
  .post("/:id/unpin", conversationController.unpinConversation)
  .get("/:id/messages", messageController.getMessages)
  .post("/:id/messages", messageController.createMessage)
  .delete("/:id", conversationController.deleteConversation)

module.exports = router;
