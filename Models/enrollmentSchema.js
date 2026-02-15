const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

batch: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "courses",
  required: true
},

  totalFee: {
    type: Number,
    required: true
  },
  
  amountPaidSoFar: {
  type: Number,
  default: 0
}
,

  paymentMode: {
    type: String,
    enum: ["Full", "EMI"],
    required: true
  },

  status: {
    type: String,
    enum: ["Active", "Completed"],
    default: "Active"
  }

}, { timestamps: true });

module.exports = mongoose.model("enrollment", enrollmentSchema);
