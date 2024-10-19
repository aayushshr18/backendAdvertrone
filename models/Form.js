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

  payDetails: {
    payCode: { type: String, default: "" },      // Pay code
    regHrs: { type: String, default: "" },       // Regular hours
    otHrs: { type: String, default: "" },        // Overtime hours
    dHrs: { type: String, default: "" },         // Double-time hours
    billRate: { type: String, default: "" },     // Billing rate
    otBillRate: { type: String, default: "" },   // Overtime billing rate
    dBillRate: { type: String, default: "" },    // Double-time billing rate
    total: { type: String, default: "" }         // Total payment
  },
  
  createdDate: { type: Date, default: Date.now }

});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
