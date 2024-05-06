const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const socketIO = require("socket.io");
const http = require("http");

const authController = require("./controllers/authController");

const userRouter = require("./routes/userRoutes");
const followRouter = require("./routes/followRoutes");
const notificationRouter = require("./routes/notificationRoutes");
const conversationRouter = require("./routes/conversationRoutes");
const videoRouter = require("./routes/videoRoutes");
const playlistRouter = require("./routes/playlistRoutes");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));

port = process.env.PORT;
database = process.env.DATABASE;

//routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/follows", followRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/playlists", playlistRouter);

//google signin
app.post('/auth/google/callback/sign-in', authController.googleLogin)

// Facebook Login Routes
app.get("/facebook/login", authController.facebookLogin);
app.get("/facebook/loginurl", authController.facebookLoginUrl);

//socket
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("New connection established.");

  socket.on("sendNotification", (data) => {
    socket.broadcast.emit("receiveNotification", {
      senderId: socket.id,
      data: data
    });
  });

  socket.on("sendMessage", (data) => {
    socket.broadcast.emit("receiveMessage", {
      senderId: socket.id,
      data: data
    });
  });

  socket.on("typingStatus", (data) => {
    socket.broadcast.emit("receiveStatus", {
      senderId: socket.id,
      data: data
    });
  });

  socket.on("seenMessage", (data) => {
    socket.broadcast.emit("receiveSeenMessage", {
      senderId: socket.id,
      data: data
    });
  });

  socket.on("deliverMessage", (data) => {
    socket.broadcast.emit("receiveDeliveredMessage", {
      senderId: socket.id,
      data: data
    });
  });
});

//mongodb connection
mongoose
  .connect(database, {
  })
  .then(() => console.log("DB connection successful!"));

//start server on port 3000
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});