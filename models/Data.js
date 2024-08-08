const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  name:{
    type:String    
  },
  number:{
    type:String
  },
  flag:{
    type:Boolean,
    default:false
  },
  agentCode:{
    type:String
  },
  userId:{
    type:String
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
});

const Data = mongoose.model("Data", dataSchema);

module.exports = Data;
