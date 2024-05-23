const express = require("express");
const router = express.Router();

const videoController = require("../controllers/videosController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .get("/all", videoController.allVideos)
  .get("/:id", videoController.getById)
  .post("/bulk_delete", videoController.bulkDelete)
  .post("/bulk_update", videoController.bulkupdate)
  .post("/", videoController.create)

module.exports = router;
