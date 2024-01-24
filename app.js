const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const authController = require("./controllers/authController");

const userRouter = require("./routes/userRoutes");
const followRouter = require("./routes/followRoutes");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));

port = process.env.PORT;
database = process.env.DATABASE;

//routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/follows", followRouter);
app.post('/auth/google/callback/sign-in', authController.googleLogin)

// Facebook Login Routes
app.get("/facebook/login", authController.facebookLogin);
app.get("/facebook/loginurl", authController.facebookLoginUrl);

//mongodb connection
mongoose
  .connect(database, {
  })
  .then(() => console.log("DB connection successful!"));

//start server on port 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});