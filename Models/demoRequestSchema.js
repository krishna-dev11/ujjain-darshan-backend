const mongoose = require("mongoose");

const demoRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

batch: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "courses",   
  required: true
}
,

  preferredDate: {
    type: Date
  },

  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending"
  },

  assignedDate: {
    type: Date
  },

  remarks: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("demorequest", demoRequestSchema);
