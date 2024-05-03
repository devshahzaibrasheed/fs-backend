const express = require("express");
const router = express.Router();

const videoController = require("../controllers/videosController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .post("/", videoController.create)

module.exports = router;
