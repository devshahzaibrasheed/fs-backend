const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");
const userController = require("./../controllers/usersController");
const blockController = require("./../controllers/blocksController");
const followController = require("./../controllers/followController");
const conversationController = require("./../controllers/conversationsController");
const videoController = require("./../controllers/videosController");
const playlistController = require("./../controllers/playlistController");

router
  .get("/:id/videos", videoController.getAll)
  .get("/:id/playlists", playlistController.getAll)
  .post("/login", authController.login)
  .post("/signup", authController.register)
  .post("/forgotPassword", authController.forgotPassword)
  .get("/url/:url", userController.getUserByUrl)
  .post("/checkValidity/:token", authController.checkValidity)
  .patch("/resetPassword/:token", authController.resetPassword)
  .post("/verify", authController.verify);

router
  .use(authController.protect)
  .get("/metadata", userController.metaData)
  .get("/blockedUsers", blockController.blockedUsers)
  .get("/export", userController.exportUsers)
  .delete("/bulk_delete", userController.deleteBulkUsers)
  .get("/:id/followers", followController.getFollowers)
  .get("/:id/following", followController.getFollowing)
  .get("/:id/friends", followController.getFriends)
  .get("/:id/conversations", conversationController.getConversations)
  .get("/search", userController.searchUsers)
  .get("/current_user", authController.currentUser)
  .post("/block", blockController.block)
  .post("/unblock", blockController.unblock)
  .patch("/update_password", authController.updatePassword)
  .get("/:id", userController.getUser)
  .patch("/:id", userController.updateUser)
  .delete("/:id", userController.deleteUser)
  .get("/", userController.getUsers)
  .post("/", userController.createUser)

module.exports = router;
