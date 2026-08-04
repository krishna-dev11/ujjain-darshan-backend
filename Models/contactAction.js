const mongoose = require("mongoose");

const contactActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["whatsapp", "call"],
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

contactActionSchema.index({ type: 1 }, { unique: true });

module.exports = mongoose.model("ContactAction", contactActionSchema);

