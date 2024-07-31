const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const teamLeaderSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  mob_no: {
    type: String,
  },
  totalBalance: {
    type: Number,
    default:0
  },
  currBalance: {
    type: Number,
    default:0
  },
  upi: {
    type: String,
  },
  ifsc: {
    type: String,
  },
  ac_no: {
    type: String,
  },
  agent_id: {
    type: Array,
  },
});

const TeamLeader = mongoose.model("teamLeader", teamLeaderSchema);
module.exports = TeamLeader;
