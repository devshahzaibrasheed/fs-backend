const mongoose = require("mongoose");
const { Schema } = mongoose;
const followSchema = new mongoose.Schema({
  follower: {
    type: Schema.Types.ObjectID,
    ref: "User"
  },
  following: {
    type: Schema.Types.ObjectID,
    ref: "User"
  }
});

const Follow = mongoose.model("Follow", followSchema);
module.exports = Follow;
