const mongoose = require("mongoose");

const walkInSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  email: {
    type: String
  },

  interestedBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "courses"
  },

  followUpDate: {
    type: Date
  },

  status: {
    type: String,
    enum: ["Interested", "NotInterested", "Admitted"],
    default: "Interested"
  },

  source: {
  type: String,
  enum: ["PHYSICAL_VISIT", "CALL", "REFERRAL"],
  default: "PHYSICAL_VISIT"
}


}, { timestamps: true });

module.exports = mongoose.model("walkin", walkInSchema);
