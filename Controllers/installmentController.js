const mongoose = require("mongoose");
// const Installment = require("../Models/installment");
const Enrollment = require("../Models/enrollmentSchema");
const User = require("../Models/user");
const installmentSchema = require("../Models/installmentSchema");
// const mongoose = require("mongoose");
// const Installment = require("../Models/installment");
// const Enrollment = require("../Models/enrollment");
// const User = require("../Models/user");
// const mongoose = require("mongoose");
// const Installment = require("../Models/installment");
// const Enrollment = require("../Models/enrollment");
// const User = require("../Models/user");
// const mongoose = require("mongoose");
// const Installment = require("../Models/installment");
// const Enrollment = require("../Models/enrollment");
// const User = require("../Models/user");



/**
 * @desc Add a new installment for an enrollment
 * @route POST /api/v1/installment/addInstallment
 * @access Instructor / Admin
 */
exports.addInstallment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { enrollmentId, amountPaid, remark , userId} = req.body;
    // console.log(req.body.user , "nikhil")

    if (!enrollmentId || !amountPaid) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "enrollmentId and amountPaid required",
      });
    }

    const numericAmount = Number(amountPaid);

    if (numericAmount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // 🔥 Fetch Enrollment
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("student")
      .session(session);

    if (!enrollment) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    if (enrollment.status === "Completed") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Already fully paid",
      });
    }

    const totalFee = enrollment.totalFee;
    const currentPaid = enrollment.amountPaidSoFar || 0;
    const newTotalPaid = currentPaid + numericAmount;

    if (newTotalPaid > totalFee) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Max payable is ₹${totalFee - currentPaid}`,
      });
    }

    // 🔥 Create Installment
    await installmentSchema.create(
      [
        {
          enrollment: enrollmentId,
          student: enrollment.student._id,
          amountPaid: numericAmount,
          remark: remark || "Installment",
        },
      ],
      { session }
    );

    // 🔥 Update Enrollment
    enrollment.amountPaidSoFar = newTotalPaid;
    enrollment.status =
      newTotalPaid === totalFee ? "Completed" : "Active";

    await enrollment.save({ session });

    // 🔥 Update User Payment Info
    const paymentStatus =
      newTotalPaid === 0
        ? "NotPaid"
        : newTotalPaid < totalFee
        ? "Partial"
        : "Paid";

    await User.findByIdAndUpdate(
      enrollment.student._id,
      {
        $inc: { totalPaid: numericAmount },
        paymentStatus: paymentStatus,
      },
      { session }
    );

        const userdata = await User
          .findById(userId)
          .populate([
            {
              path: "courses",
              populate: [
                {
                  path: "courseContent",
                  populate: {
                    path: "subSections",
                  },
                },
                {
                  path: "ratingAndReviews",
                },
    {
      path: "studentEnrolled.student",
      select:
        "firstName lastName email imageUrl totalPaid paymentStatus additionalDetails createdAt",
      populate: {
        path: "additionalDetails",
        select: "contactNumber",
      },
    },
    {
      path: "studentEnrolled.enrollment",
      select: "totalFee paymentMode status amountPaidSoFar createdAt ",
    }
    
              ],
            },
            {
              path: "additionalDetails",
            },
          ])
          .exec();

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Installment added successfully",
      totalPaid: newTotalPaid,
      remaining: totalFee - newTotalPaid,
      userdata,
      paymentStatus,
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Add Installment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};









/**
 * @desc Get all installments for a specific enrollment
 * @route GET /api/v1/installment/getInstallmentsByEnrollment/:enrollmentId
 * @access Instructor / Admin
 */
exports.getInstallmentsByEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        message: "enrollmentId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollmentId format",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can view installments",
      });
    }

    // ---------- CHECK ENROLLMENT EXISTS ----------
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("student", "firstName lastName email");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // ---------- FETCH INSTALLMENTS ----------
    const installments = await installmentSchema.find({ enrollment: enrollmentId })
      .sort({ paymentDate: 1 }) // oldest → newest
      .lean();

    // Calculate totals
    const totalPaid = installments.reduce(
      (sum, inst) => sum + inst.amountPaid,
      0
    );

    return res.status(200).json({
      success: true,
      message: "Installments fetched successfully",
      data: {
        enrollment: {
          _id: enrollment._id,
          totalFee: enrollment.totalFee,
          paymentMode: enrollment.paymentMode,
          status: enrollment.status,
          student: enrollment.student,
        },
        summary: {
          totalPaidSoFar: totalPaid,
          remainingAmount: enrollment.totalFee - totalPaid,
          totalInstallments: installments.length,
        },
        installments,
      },
    });
  } catch (error) {
    console.error("Error in getInstallmentsByEnrollment:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch installments",
      error: error.message,
    });
  }
};







/**
 * @desc Calculate remaining amount for an enrollment
 * @route GET /api/v1/installment/calculateRemainingAmount/:enrollmentId
 * @access Instructor / Admin
 */
exports.calculateRemainingAmount = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        message: "enrollmentId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollmentId format",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can calculate remaining amount",
      });
    }

    // ---------- CHECK ENROLLMENT ----------
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("student", "firstName lastName email");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // ---------- CALCULATE FROM INSTALLMENTS (SOURCE OF TRUTH) ----------
    const installments = await installmentSchema.find({ enrollment: enrollmentId });

    const totalPaid = installments.reduce(
      (sum, inst) => sum + inst.amountPaid,
      0
    );

    const remainingAmount = Math.max(
      0,
      enrollment.totalFee - totalPaid
    );

    const isFullyPaid = remainingAmount === 0;

    return res.status(200).json({
      success: true,
      message: "Remaining amount calculated successfully",
      data: {
        enrollmentId: enrollment._id,
        student: enrollment.student,
        totalFee: enrollment.totalFee,
        totalPaidSoFar: totalPaid,
        remainingAmount,
        paymentStatus: isFullyPaid ? "Paid" : "Partial",
        totalInstallments: installments.length,
      },
    });
  } catch (error) {
    console.error("Error in calculateRemainingAmount:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate remaining amount",
      error: error.message,
    });
  }
};
