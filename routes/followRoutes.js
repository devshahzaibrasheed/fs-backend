const express = require("express");
const router = express.Router();

const followController = require("../controllers/followController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .post("/", followController.follow)
  .post("/unfollow", followController.unfollow)

module.exports = router;
