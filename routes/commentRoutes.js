const express = require("express");
const router = express.Router();

const commentController = require("../controllers/commentsController");
const authController = require("../controllers/authController");

router
  .use(authController.protect)
  .post("/", commentController.create)
  .patch("/:id", commentController.update)
  .delete("/:id", commentController.delete)

module.exports = router;
