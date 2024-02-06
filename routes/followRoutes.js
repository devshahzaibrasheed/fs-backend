const express = require("express");
const router = express.Router();

const followController = require("../controllers/followController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .post("/", followController.follow)
  .post("/unfollow", followController.unfollow)
  .post("/remove_follower", followController.removeFollower)

module.exports = router;
