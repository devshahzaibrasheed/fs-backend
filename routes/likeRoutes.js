const express = require("express");
const router = express.Router();

const likeController = require("../controllers/likesController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .post("/", likeController.create)
  .post("/unlike", likeController.delete)

module.exports = router;
