const mongoose = require("mongoose");

const reqSchema = new mongoose.Schema({
  amt: {
    type: Number,
  },
  status: {
    type: String,
    enum:["Pending","Approved","Rejected"],
    default: "Pending",
  },
  email: {
    type: String,
  },
  name: {
    type: String,
  },
  userId: {
    type: String,
  },
});

const Req = mongoose.model("Req", reqSchema);

module.exports = Req;
