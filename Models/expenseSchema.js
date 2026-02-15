const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    expenseDate: {
      type: Date,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      index: true,
    },
    week: {
      type: String,
      required: true,
      index: true,
    },
    day: {
      type: Number,
      required: true,
      index: true,
    },
    billNumber: {
      type: String,
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("expense", expenseSchema);

