const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");

router
  .post("/login", authController.login)
  .post("/signup", authController.register)
  .post("/forgotPassword", authController.forgotPassword)
  .post("/checkValidity/:token", authController.checkValidity)
  .patch("/resetPassword/:token", authController.resetPassword)

router
  .use(authController.protect)
  .get("/current_user", authController.currentUser)

module.exports = router;
