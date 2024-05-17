const express = require("express");
const router = express.Router();

const playlistController = require("../controllers/playlistController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .get("/all", playlistController.getUserPlaylists)
  .get("/", playlistController.getAll)
  .post("/", playlistController.create)

module.exports = router;
