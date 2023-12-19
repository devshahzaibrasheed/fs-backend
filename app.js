const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));

port = process.env.PORT;
database = process.env.DATABASE;

//mongodb connection
mongoose
  .connect(database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful!"));

//start server on port 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});