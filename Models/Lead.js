const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    phone: { type: String, required: true, index: true },
    email: String,

    source: {
      type: String,
      enum: ["PHYSICAL_VISIT", "WEBSITE", "REFERRAL", "DEMO", "ADS", "SOCIAL_MEDIA"],
      required: true,
      index: true,
    },

  interestedCourse: { type: mongoose.Schema.Types.ObjectId, ref: "courses" }, 
assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, 


    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "DROPPED"],
      default: "NEW",
      index: true,
    },

    visitedDate: { type: Date },
    nextFollowUpDate: { type: Date },

    

    remarks: String,
    followUpHistory: [
      {
        date: Date,
        note: String,
        handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    convertedToStudent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", LeadSchema);
