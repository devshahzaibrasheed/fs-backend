const express = require("express");
const router = express.Router();

const playlistController = require("../controllers/playlistController");
const authController = require("../controllers/authController");

router
  .get("/:id", playlistController.getPlaylistVideos)

router
  .use(authController.protect)
  .post("/bulk_delete", playlistController.bulkDelete)
  .post("/bulk_update", playlistController.bulkupdate)
  .patch("/:id", playlistController.update)
  .post("/", playlistController.create)

module.exports = router;
