const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");

router
  .post("/login", authController.login)
  .post("/signup", authController.register)

router
  .use(authController.protect)
  .get("/current_user", authController.currentUser)

module.exports = router;
