const mongoose = require("mongoose");
const WalkIn = require("../Models/walkInSchema");
const courses = require("../Models/courses"); // batch = course
const user = require("../Models/user");
const Enrollment = require("../Models/enrollmentSchema");
const Installment = require("../Models/installmentSchema");
const Profile = require("../Models/profile");
const User = require("../Models/user");



/**
 * @desc Add a new Walk-In Student (physical visit lead)
 * @route POST /api/v1/walkin/addWalkInStudent
 * @access Instructor / Admin
 */
exports.addWalkInStudent = async (req, res) => {
  try {
    const {
      studentName,
      phone,
      email,
      interestedBatch,
      followUpDate,
      status,
      source,
    } = req.body;

    // ---------- VALIDATION ----------
    if (!studentName || !phone) {
      return res.status(400).json({
        success: false,
        message: "studentName and phone are required",
      });
    }

    if (interestedBatch && !mongoose.Types.ObjectId.isValid(interestedBatch)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interestedBatch (courseId) format",
      });
    }

    // Check role (only instructor/admin can add walk-in)
    const staffId = req.user.id;
    const staff = await user.findById(staffId);

    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can add walk-in students",
      });
    }

    // If batch provided, ensure it exists
    let batchDetails = null;
    if (interestedBatch) {
      batchDetails = await courses.findById(interestedBatch);
      if (!batchDetails) {
        return res.status(404).json({
          success: false,
          message: "Interested batch (course) not found",
        });
      }
    }

    // Prevent duplicate walk-in on same phone (same day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const duplicate = await WalkIn.findOne({
      phone,
      createdAt: { $gte: todayStart },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Walk-in already registered today with this phone number",
      });
    }

    // ---------- CREATE WALK-IN ----------
    const walkIn = await WalkIn.create({
      studentName,
      phone,
      email: email || null,
      interestedBatch: interestedBatch || null,
      followUpDate: followUpDate || null,
      status: status || "Interested",
      source: source || "PHYSICAL_VISIT",
    });

    // Populate batch for frontend usefulness
    const populatedWalkIn = await WalkIn.findById(walkIn._id).populate(
      "interestedBatch",
      "courseName batchStartDate batchTiming batchStatus"
    );

    return res.status(201).json({
      success: true,
      message: "Walk-in student added successfully",
      data: populatedWalkIn,
    });
  } catch (error) {
    console.error("Error in addWalkInStudent:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add walk-in student",
      error: error.message,
    });
  }
};






/**
 * @desc Delete a walk-in student (Not Interested case)
 * @route DELETE /api/v1/walkin/deleteWalkInStudent
 * @access Instructor / Admin
 */
exports.deleteWalkInStudent = async (req, res) => {
  try {
    const { walkInId } = req.body;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!walkInId) {
      return res.status(400).json({
        success: false,
        message: "walkInId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(walkInId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid walkInId format",
      });
    }

    // Role check
    const staff = await user.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can delete walk-in records",
      });
    }

    // Check if record exists
    const walkIn = await WalkIn.findById(walkInId);
    if (!walkIn) {
      return res.status(404).json({
        success: false,
        message: "Walk-in student not found",
      });
    }

    // Optional: Prevent deleting already admitted students
    if (walkIn.status === "Admitted") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a walk-in already marked as Admitted",
      });
    }

    // Delete record
    await WalkIn.findByIdAndDelete(walkInId);

    return res.status(200).json({
      success: true,
      message: "Walk-in student deleted successfully",
      data: { deletedId: walkInId },
    });
  } catch (error) {
    console.error("Error in deleteWalkInStudent:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete walk-in student",
      error: error.message,
    });
  }
};








/**
 * @desc Get all walk-in students with filters, pagination, and sorting
 * @route GET /api/v1/walkin/getAllWalkIns
 * @access Instructor / Admin
 */
exports.getAllWalkIns = async (req, res) => {
  try {
    const { status, phone, startDate, endDate, page = 1, limit = 10 } = req.query;
    const staffId = req.user.id;

    // ---------- ROLE CHECK ----------
    const staff = await user.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can access walk-in records",
      });
    }

    // ---------- BUILD FILTER ----------
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (phone) {
      filter.phone = phone;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // ---------- PAGINATION ----------
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * pageSize;

    const totalWalkIns = await WalkIn.countDocuments(filter);

    const walkIns = await WalkIn.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate(
        "interestedBatch",
        "courseName batchStartDate batchTiming batchStatus"
      );

    return res.status(200).json({
      success: true,
      message: "Walk-in students fetched successfully",
      total: totalWalkIns,
      page: pageNumber,
      limit: pageSize,
      data: walkIns,
    });
  } catch (error) {
    console.error("Error in getAllWalkIns:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch walk-in students",
      error: error.message,
    });
  }
};






/**
 * @desc Get a single walk-in student by ID
 * @route GET /api/v1/walkin/getOneWalkIn/:walkInId
 * @access Instructor / Admin
 */
exports.getOneWalkIn = async (req, res) => {
  try {
    const { walkInId } = req.params;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!walkInId) {
      return res.status(400).json({
        success: false,
        message: "walkInId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(walkInId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid walkInId format",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await user.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can access walk-in records",
      });
    }

    // ---------- FETCH WALK-IN ----------
    const walkIn = await WalkIn.findById(walkInId)
      .populate(
        "interestedBatch",
        "courseName batchStartDate batchEndDate batchTiming batchStatus"
      );

    if (!walkIn) {
      return res.status(404).json({
        success: false,
        message: "Walk-in student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Walk-in student fetched successfully",
      data: walkIn,
    });
  } catch (error) {
    console.error("Error in getOneWalkIn:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch walk-in student",
      error: error.message,
    });
  }
};





exports.convertWalkInToUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      batchId,
      totalFee,
      paymentMode,
      paidAmount,
      email,
      firstName,
      lastName,
      contactNumber
    } = req.body;

    const walkInId = req.params.walkInId;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!walkInId || !batchId || !totalFee || !paymentMode || !email) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "walkInId, batchId, totalFee, paymentMode and email are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(walkInId) ||
        !mongoose.Types.ObjectId.isValid(batchId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid walkInId or batchId",
      });
    }

    if (!["Full", "EMI"].includes(paymentMode)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid payment mode",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId).session(session);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Only Instructor/Admin can convert walk-in",
      });
    }

    // ---------- FETCH WALK-IN ----------
    const walkIn = await WalkIn.findById(walkInId).session(session);
    if (!walkIn) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Walk-in not found",
      });
    }

    // ---------- FETCH BATCH ----------
    const batch = await courses.findById(batchId).session(session);
    if (!batch) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // ---------- SEAT CHECK ----------
    if (batch.maxSeats && batch.studentEnrolled.length >= batch.maxSeats) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Batch is full",
      });
    }

    // ---------- FIND OR CREATE USER ----------
    let student = await User.findOne({ email }).session(session);

    if (!student) {
      const profile = await Profile.create([{
        gender: null,
        dateOfBirth: null,
        about: null,
        contactNumber: contactNumber || walkIn.phone,
      }], { session });

      const newUser = await User.create([{
        firstName: firstName || walkIn.studentName.split(" ")[0],
        lastName: lastName || walkIn.studentName.split(" ")[1] || "",
        email,
        password: "GOOGLE_AUTH_USER",
        accountType: "Student",
        additionalDetails: profile[0]._id,
        imageUrl: `https://api.dicebear.com/5.x/initials/svg?seed=${walkIn.studentName}`,
        userRole: "Enrolled",
        phoneVerified: true
      }], { session });

      student = newUser[0];
    }

    // ---------- CREATE ENROLLMENT ----------
    const enrollment = await Enrollment.create([{
      student: student._id,
      batch: batchId,
      amountPaidSoFar:paidAmount,
      totalFee,
      paymentMode,
      status: "Active"
    }], { session });

    // ---------- HANDLE PAYMENT ----------
    let totalPaid = 0;

    if (paymentMode === "Full") {
      totalPaid = totalFee;
    } else {
      if (!paidAmount || paidAmount <= 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Paid amount required for EMI",
        });
      }
      totalPaid = paidAmount;
    }

    // ---------- CREATE INSTALLMENT RECORD ----------
    await Installment.create([{
      enrollment: enrollment[0]._id,
      student: student._id,
      amountPaid: totalPaid,
      remark: paymentMode === "Full" ? "Full Payment" : "First EMI"
    }], { session });

    // ---------- CALCULATE PAYMENT STATUS ----------
    const paymentStatus =
      totalPaid === 0 ? "NotPaid" :
      totalPaid < totalFee ? "Partial" : "Paid";

    // ---------- UPDATE USER ----------
    await User.findByIdAndUpdate(
      student._id,
      {
        $addToSet: {
          assignedBatch: batchId,
          courses: batchId
        },
        $inc: { totalPaid: totalPaid },
        paymentStatus,
        userRole: "Enrolled"
      },
      { session }
    );

    // ---------- ADD STUDENT TO BATCH ----------
    await courses.findByIdAndUpdate(
      batchId,
      {
        $push: {
          studentEnrolled: {
            student: student._id,
            enrollment: enrollment[0]._id
          }
        }
      },
      { session }
    );

    // ---------- DELETE WALK-IN ----------
    await WalkIn.findByIdAndDelete(walkInId).session(session);

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Walk-in successfully converted to enrolled student",
      data: {
        studentId: student._id,
        enrollmentId: enrollment[0]._id,
        batchId,
        totalPaid,
        paymentStatus
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("convertWalkInToUser Error:", error);

    return res.status(500).json({
      success: false,
      message: "Conversion failed",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};


