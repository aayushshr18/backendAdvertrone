const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  poNo: { type: String, required: true },
  billingAddress: { type: String, required: true },
  invNo: { type: String, required: true },
  invDate: { type: String, required: true },
  invAmt: { type: String, required: true },
  customer: { type: String, required: true },

  street: {
    type: String,
  },
  pinCode: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },

  table1: {
    type: [String],
    default: ["", "", "", "", "", "", "", ""],
  },

  webCenterTimeDetails: {
    type: [[String]],
    default: [
      ["", "", "", "", "", "", ""], // In
      ["", "", "", "", "", "", ""], // Break
      ["", "", "", "", "", "", ""], // Lunch Out
      ["", "", "", "", "", "", ""], // Lunch In
      ["", "", "", "", "", "", ""], // Lunch O2
      ["", "", "", "", "", "", ""], // Lunch I2
      ["", "", "", "", "", "", ""], // Out
      ["", "", "", "", "", "", ""], // Hours
    ],
  },
  createdDate: { type: Date, default: Date.now }

});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
