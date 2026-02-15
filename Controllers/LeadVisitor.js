// controllers/leadController.js
const Lead = require("../Models/Lead");
const Course = require("../Models/courses");
const User = require("../Models/user");

exports.createLead = async (req, res) => {
  try {
    let {
      name,
      phone,
      email,
      source,
      interestedCourse,
      visitedDate,
      assignedStaff,
      remarks,
    } = req.body;

    // ----------- 1) BASIC VALIDATION -----------
    if (!name || !phone || !source) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and source are required",
      });
    }

    // ----------- 2) CHECK VALID SOURCE -----------
    const allowedSources = [
      "PHYSICAL_VISIT",
      "WEBSITE",
      "REFERRAL",
      "DEMO",
      "ADS",
      "SOCIAL_MEDIA",
    ];

    if (!allowedSources.includes(source)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source type",
      });
    }

    // ----------- 3) CHECK IF COURSE EXISTS (IF PROVIDED) -----------
    if (interestedCourse) {
      const courseExists = await Course.findById(interestedCourse);
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Interested course not found",
        });
      }
    }

    // ----------- 4) CHECK IF STAFF EXISTS (IF PROVIDED) -----------
    if (assignedStaff) {
      const staffExists = await User.findOne({
        _id: assignedStaff,
        role: { $in: ["ADMIN", "MARKETING", "STAFF"] },
      });

      if (!staffExists) {
        return res.status(404).json({
          success: false,
          message: "Assigned staff not found or not valid",
        });
      }
    }

    // ----------- 5) DUPLICATE LEAD HANDLING -----------
    // Same phone + recent lead (last 30 days) = update instead of new
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingLead = await Lead.findOne({
      phone,
      createdAt: { $gte: thirtyDaysAgo },
    });

    if (existingLead) {
      existingLead.status = "NEW";
      existingLead.source = source;
      existingLead.interestedCourse = interestedCourse || existingLead.interestedCourse;
      existingLead.visitedDate = visitedDate || existingLead.visitedDate;
      existingLead.remarks = remarks || existingLead.remarks;

      // Add follow-up note automatically
      existingLead.followUpHistory.push({
        date: new Date(),
        note: "Lead revisited / updated",
        handledBy: assignedStaff || null,
      });

      await existingLead.save();

      return res.status(200).json({
        success: true,
        message: "Existing lead updated",
        lead: existingLead,
      });
    }

    // ----------- 6) AUTO NEXT FOLLOW-UP DATE -----------
    let nextFollowUpDate = new Date();
    nextFollowUpDate.setDate(nextFollowUpDate.getDate() + 3); // 3 days later

    // ----------- 7) CREATE NEW LEAD (FINAL) -----------
    const newLead = await Lead.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim().toLowerCase(),
      source,
      interestedCourse,
      status: "NEW",
      visitedDate: visitedDate || new Date(),
      nextFollowUpDate,
      assignedStaff: assignedStaff || null,
      remarks: remarks || "",
      followUpHistory: [
        {
          date: new Date(),
          note: "New lead created",
          handledBy: assignedStaff || null,
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead: newLead,
    });
  } catch (error) {
    console.error("Create Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating lead",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
