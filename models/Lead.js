const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  referred_agent_id: {
    type: String,
     },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "employees",
  },
  company_name: {
    type: Array,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  mob_no: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  date: {
    type: Date,
  },
});

const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;
