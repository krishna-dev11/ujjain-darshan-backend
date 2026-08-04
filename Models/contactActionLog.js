const mongoose = require("mongoose");

const contactActionLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["whatsapp", "call"],
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
      index: true,
    },
    userName: {
      type: String,
      default: "Guest User",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    contactNumber: {
      type: String,
      default: "",
      trim: true,
    },
    accountType: {
      type: String,
      default: "",
      trim: true,
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

contactActionLogSchema.index({ createdAt: -1 });
contactActionLogSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("ContactActionLog", contactActionLogSchema);
