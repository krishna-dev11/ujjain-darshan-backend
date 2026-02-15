const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema({
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "enrollment",
    required: true
  },

  amountPaid: {
    type: Number,
    required: true
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  remark: {
    type: String
  },

  student: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "user"
}


}, { timestamps: true });

module.exports = mongoose.model("installment", installmentSchema);
