const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");
const userController = require("./../controllers/usersController");

router
  .post("/login", authController.login)
  .post("/signup", authController.register)
  .post("/forgotPassword", authController.forgotPassword)
  .post("/checkValidity/:token", authController.checkValidity)
  .patch("/resetPassword/:token", authController.resetPassword)
  .post("/verify", authController.verify);

router
  .use(authController.protect)
  .get("/current_user", authController.currentUser)
  .get("/:id", userController.getUser)
  .patch("/:id", userController.updateUser)
  .delete("/:id", userController.deleteUser)
  .get("/", userController.getUsers)

module.exports = router;
