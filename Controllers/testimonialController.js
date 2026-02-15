const mongoose = require("mongoose");
const Testimonial = require("../Models/testimonial");
const User = require("../Models/user");
const Courses = require("../Models/courses");
const { uploadImageToCloudinary } = require("../Utilities/uploadImageToCloudinary");
// const { uploadImageToCloudinary } = require("../Utilities/imageUploader");
// const mongoose = require("mongoose");
// const Testimonial = require("../Models/testimonial");
// const mongoose = require("mongoose");
// const Testimonial = require("../Models/testimonial");
// const User = require("../Models/user");

/**
 * @desc Add a new testimonial (video/image + text)
 * @route POST /api/v1/testimonial/addTestimonial
 * @access Instructor / Admin
 */
exports.addTestimonial = async (req, res) => {
  try {
    const {
      studentName,
      studentBatch,   // courseId (batch = course)
      rating,
      message,
      isVideo,        // true / false
      status          // "Active" / "Inactive"
    } = req.body;

    const mediaFile = req.files?.media;
    const staffId = req.user.id;

    // -------- VALIDATION --------
    if (!studentName || !studentBatch || !rating || !message) {
      return res.status(400).json({
        success: false,
        message: "studentName, studentBatch, rating and message are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentBatch)) {
      return res.status(400).json({
        success: false,
        message: "Invalid studentBatch (courseId) format",
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "rating must be a number between 1 and 5",
      });
    }

    // -------- ROLE CHECK --------
    const staff = await User.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can add testimonials",
      });
    }

    // -------- CHECK BATCH (COURSE) EXISTS --------
    const batch = await Courses.findById(studentBatch);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch (course) not found",
      });
    }

    // -------- MEDIA VALIDATION --------
    if (!mediaFile) {
      return res.status(400).json({
        success: false,
        message: "Testimonial media (image or video) is required",
      });
    }

    // -------- DUPLICATE CHECK (same student, same batch) --------
    const existing = await Testimonial.findOne({
      studentName,
      studentBatch,
      status: "Active",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An active testimonial already exists for this student & batch",
      });
    }

    // -------- UPLOAD TO CLOUDINARY --------
    const uploadedMedia = await uploadImageToCloudinary(
      mediaFile,
      process.env.CLOUDINARY_FOLDER || "testimonials"
    );

    // -------- CREATE TESTIMONIAL --------
    const testimonial = await Testimonial.create({
      studentName: studentName.trim(),
      studentBatch,
      rating: numericRating,
      message: message.trim(),
      mediaUrl: uploadedMedia.secure_url,
      mediaType: isVideo === "true" || isVideo === true ? "Video" : "Image",
      status: status || "Active",
      createdBy: staff._id,
    });

    return res.status(201).json({
      success: true,
      message: "Testimonial added successfully",
      data: testimonial,
    });
  } catch (error) {
    console.error("Error in addTestimonial:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add testimonial",
      error: error.message,
    });
  }
};






/**
 * @desc Get all testimonials (with filters & pagination)
 * @route GET /api/v1/testimonial/getAllTestimonials
 * @access Public (frontend home page) / Instructor-Admin (optional)
 */
exports.getAllTestimonials = async (req, res) => {
  try {
    let { page = 1, limit = 10, status = "Active" } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page <= 0) page = 1;
    if (isNaN(limit) || limit <= 0) limit = 10;

    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    if (status !== "All") {
      filter.status = status;
    }

    // Fetch testimonials
    const testimonials = await Testimonial.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .populate("studentBatch", "courseName thumbnail price")
      .populate("createdBy", "firstName lastName email")
      .lean();

    const totalCount = await Testimonial.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      message: "Testimonials fetched successfully",
      data: {
        page,
        limit,
        totalPages,
        totalTestimonials: totalCount,
        testimonials,
      },
    });
  } catch (error) {
    console.error("Error in getAllTestimonials:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch testimonials",
      error: error.message,
    });
  }
};






/**
 * @desc Delete a testimonial
 * @route DELETE /api/v1/testimonial/deleteTestimonial
 * @access Instructor / Admin
 */
exports.deleteTestimonial = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { testimonialId } = req.body;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!testimonialId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "testimonialId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(testimonialId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid testimonialId format",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId).session(session);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can delete testimonials",
      });
    }

    // ---------- CHECK EXISTENCE ----------
    const testimonial = await Testimonial.findById(testimonialId).session(session);
    if (!testimonial) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    // ---------- DELETE TESTIMONIAL (HARD DELETE) ----------
    await Testimonial.findByIdAndDelete(testimonialId).session(session);

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
      data: {
        deletedTestimonialId: testimonialId,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in deleteTestimonial:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete testimonial",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
