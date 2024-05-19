const express = require("express");
const router = express.Router();

const videoController = require("../controllers/videosController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .get("/all", videoController.allVideos)
  .get("/", videoController.getAll)
  .get("/:id", videoController.getById)
  .post("/", videoController.create)

module.exports = router;
