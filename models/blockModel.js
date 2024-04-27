const mongoose = require("mongoose");
const { Schema } = mongoose;

const blockSchema = new mongoose.Schema({
  blocked: {
    type: Schema.Types.ObjectID,
    ref: "User"
  },
  blockedBy: {
    type: Schema.Types.ObjectID,
    ref: "User"
  }
},
{
  timestamps: true,
});

const Block = mongoose.model("Block", blockSchema);
module.exports = Block;
