const mongoose = require("mongoose");
const DemoRequest = require("../Models/demorequest");
const courses = require("../Models/courses"); // batch = course
const user = require("../Models/user");
// const DemoRequest = require("../Models/demorequest");
// const courses = require("../Models/courses"); // batch = course
// const user = require("../Models/user");
// const DemoRequest = require("../Models/demorequest");
// const courses = require("../Models/courses"); // batch = course
// const user = require("../Models/user");
// const mongoose = require("mongoose");
// const DemoRequest = require("../Models/demorequest");
// const user = require("../Models/user");
// const mongoose = require("mongoose");
// const DemoRequest = require("../Models/demorequest");
// const user = require("../Models/user");



exports.createDemoRequest = async (req, res) => {
  try {
    const { batch, preferredDate, remarks } = req.body;
    const studentId = req.user.id;

    // ---------- VALIDATION ----------
    if (!batch) {
      return res.status(400).json({
        success: false,
        message: "batch (courseId) is required to request a demo",
      });
    }

    // Check student exists
    const student = await user.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check batch (course) exists
    const batchDetails = await courses.findById(batch);
    if (!batchDetails) {
      return res.status(404).json({
        success: false,
        message: "Batch (Course) not found",
      });
    }

    // Prevent duplicate pending demo for same batch
    const existingRequest = await DemoRequest.findOne({
      student: studentId,
      batch: batch,
      status: "Pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending demo request for this batch",
      });
    }

    // ---------- CREATE DEMO REQUEST ----------
    const demoRequest = await DemoRequest.create({
      student: studentId,
      batch: batch,
      preferredDate: preferredDate || null,
      remarks: remarks || "",
      status: "Pending",
    });

    // Populate useful fields for frontend
    const populatedDemo = await DemoRequest.findById(demoRequest._id)
      .populate("student", "firstName lastName email")
      .populate("batch", "courseName batchStartDate batchTiming");

    return res.status(201).json({
      success: true,
      message: "Demo request created successfully",
      data: populatedDemo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create demo request",
      error: error.message,
    });
  }
};






exports.getAllDemoRequests = async (req, res) => {
  try {
    const { status, batch, student } = req.query;

    // Build filter dynamically
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (batch) {
      filter.batch = batch;
    }

    if (student) {
      filter.student = student;
    }

    const demoRequests = await DemoRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("student", "firstName lastName email phone")
      .populate(
        "batch",
        "courseName batchStartDate batchEndDate batchTiming batchStatus"
      );

    if (!demoRequests || demoRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No demo requests found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "All demo requests fetched successfully",
      total: demoRequests.length,
      data: demoRequests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch demo requests",
      error: error.message,
    });
  }
};






/**
 * @desc Accept a demo request
 * @route POST /api/v1/demo/acceptDemoRequest
 * @access Instructor / Admin
 */
exports.acceptDemoRequest = async (req, res) => {
  try {
    const { demoRequestId, assignedDate, remarks } = req.body;
    const instructorId = req.user.id;

    // ---------- VALIDATION ----------
    if (!demoRequestId) {
      return res.status(400).json({
        success: false,
        message: "demoRequestId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(demoRequestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demoRequestId format",
      });
    }

    // Check instructor exists & role
    const instructor = await user.findById(instructorId);
    if (!instructor || instructor.accountType !== "Instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructor can accept demo requests",
      });
    }

    // Fetch demo request
    const demoRequest = await DemoRequest.findById(demoRequestId);
    if (!demoRequest) {
      return res.status(404).json({
        success: false,
        message: "Demo request not found",
      });
    }

    // Prevent re-acceptance (idempotency)
    if (demoRequest.status === "Accepted") {
      return res.status(200).json({
        success: true,
        message: "Demo request is already accepted",
        data: demoRequest,
      });
    }

    if (demoRequest.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot accept a rejected demo request",
      });
    }

    // Verify batch exists
    const batchExists = await courses.findById(demoRequest.batch);
    if (!batchExists) {
      return res.status(404).json({
        success: false,
        message: "Associated batch (course) not found",
      });
    }

    // ---------- UPDATE DEMO REQUEST ----------
    demoRequest.status = "Accepted";
    demoRequest.assignedDate = assignedDate || demoRequest.preferredDate || null;
    if (remarks) demoRequest.remarks = remarks;

    await demoRequest.save();

    // Populate useful fields for frontend
    const populatedDemo = await DemoRequest.findById(demoRequestId)
      .populate("student", "firstName lastName email phone")
      .populate(
        "batch",
        "courseName batchStartDate batchTiming batchStatus"
      );

    return res.status(200).json({
      success: true,
      message: "Demo request accepted successfully",
      data: populatedDemo,
    });
  } catch (error) {
    console.error("Error in acceptDemoRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to accept demo request",
      error: error.message,
    });
  }
};






/**
 * @desc Reject a demo request
 * @route POST /api/v1/demo/rejectDemoRequest
 * @access Instructor / Admin
 */
exports.rejectDemoRequest = async (req, res) => {
  try {
    const { demoRequestId, remarks } = req.body;
    const instructorId = req.user.id;

    // ---------- VALIDATION ----------
    if (!demoRequestId) {
      return res.status(400).json({
        success: false,
        message: "demoRequestId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(demoRequestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demoRequestId format",
      });
    }

    // Check instructor exists & role
    const instructor = await user.findById(instructorId);
    if (!instructor || instructor.accountType !== "Instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructor can reject demo requests",
      });
    }

    // Fetch demo request
    const demoRequest = await DemoRequest.findById(demoRequestId);
    if (!demoRequest) {
      return res.status(404).json({
        success: false,
        message: "Demo request not found",
      });
    }

    // ---------- IDEMPOTENCY & STATUS RULES ----------
    if (demoRequest.status === "Rejected") {
      return res.status(200).json({
        success: true,
        message: "Demo request is already rejected",
        data: demoRequest,
      });
    }

    if (demoRequest.status === "Accepted") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an already accepted demo request",
      });
    }

    // ---------- UPDATE DEMO REQUEST ----------
    demoRequest.status = "Rejected";
    if (remarks) demoRequest.remarks = remarks;

    await demoRequest.save();

    // Populate useful fields for frontend
    const populatedDemo = await DemoRequest.findById(demoRequestId)
      .populate("student", "firstName lastName email phone")
      .populate(
        "batch",
        "courseName batchStartDate batchTiming batchStatus"
      );

    return res.status(200).json({
      success: true,
      message: "Demo request rejected successfully",
      data: populatedDemo,
    });
  } catch (error) {
    console.error("Error in rejectDemoRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject demo request",
      error: error.message,
    });
  }
};






/**
 * @desc Assign / update demo date for a demo request
 * @route POST /api/v1/demo/assignDemoDate
 * @access Instructor / Admin
 */
exports.assignDemoDate = async (req, res) => {
  try {
    const { demoRequestId, assignedDate, remarks } = req.body;
    const instructorId = req.user.id;

    // ---------- VALIDATION ----------
    if (!demoRequestId || !assignedDate) {
      return res.status(400).json({
        success: false,
        message: "demoRequestId and assignedDate are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(demoRequestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demoRequestId format",
      });
    }

    // Check instructor role
    const instructor = await user.findById(instructorId);
    if (!instructor || instructor.accountType !== "Instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructor can assign demo date",
      });
    }

    // Fetch demo request
    const demoRequest = await DemoRequest.findById(demoRequestId);
    if (!demoRequest) {
      return res.status(404).json({
        success: false,
        message: "Demo request not found",
      });
    }

    // ---------- BUSINESS RULES ----------
    if (demoRequest.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign date to a rejected demo request",
      });
    }

    // If still Pending, auto-move to Accepted
    if (demoRequest.status === "Pending") {
      demoRequest.status = "Accepted";
    }

    // ---------- UPDATE ----------
    demoRequest.assignedDate = new Date(assignedDate);
    if (remarks) demoRequest.remarks = remarks;

    await demoRequest.save();

    // Populate useful fields for frontend
    const populatedDemo = await DemoRequest.findById(demoRequestId)
      .populate("student", "firstName lastName email phone")
      .populate(
        "batch",
        "courseName batchStartDate batchTiming batchStatus"
      );

    return res.status(200).json({
      success: true,
      message: "Demo date assigned successfully",
      data: populatedDemo,
    });
  } catch (error) {
    console.error("Error in assignDemoDate:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign demo date",
      error: error.message,
    });
  }
};

