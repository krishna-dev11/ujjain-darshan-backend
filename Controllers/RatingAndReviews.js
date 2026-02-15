const { default: mongoose } = require("mongoose");
const courses = require("../Models/courses");
const ratingAndReviews = require("../Models/ratingAndReviews");



exports.createRatingAndReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, rating, reviews, forType = "Course" } = req.body;

    if (!courseId || !rating || !reviews) {
      return res.status(400).json({
        success: false,
        message: "Please Provide All Data",
      });
    }

    const parsedRating = parseFloat(rating);

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Invalid rating. It should be a number between 1 and 5.",
      });
    }

    // Check if course exists (batch = course)
    const iscourseExist = await courses.findById(courseId);
    if (!iscourseExist) {
      return res.status(400).json({
        success: false,
        message: "Course Not Found",
      });
    }

    // Check if user enrolled in this batch/course
    const isUserAlreadyHit = await courses.findOne({
      _id: courseId,
      studentEnrolled: userId,
    });

    if (!isUserAlreadyHit) {
      return res.status(403).json({
        success: false,
        message: "Student is not enrolled in the course",
      });
    }

    // Check if already reviewed
    const AlreadyReviewed = await ratingAndReviews.findOne({
      user: userId,
      course: courseId,
      forType,
    });

    if (AlreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "Course already reviewed by the user",
      });
    }

    // Create rating & review (NEW: forType field included)
    const createRatingandReviews = await ratingAndReviews.create({
      user: userId,
      course: courseId,
      rating: parsedRating,
      reviews: reviews,
      forType, // 🔥 NEW (but backward compatible)
    });

    if (!createRatingandReviews) {
      return res.status(500).json({
        success: false,
        message: "Error in creating rating and reviews",
      });
    }

    await courses.findByIdAndUpdate(
      courseId,
      {
        $push: {
          ratingAndReviews: createRatingandReviews._id,
        },
      },
      { new: true }
    );

    // 🔹 SAME RESPONSE AS BEFORE (UI SAFE)
    return res.status(200).json({
      success: true,
      message: "Rating and review successfully created",
      data: createRatingandReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Some error occurred in creating the rating and reviews",
    });
  }
};





exports.getAverageRating = async (req, res) => {
  try {
    const { courseId, forType = "Course" } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const result = await ratingAndReviews.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
          forType, // 🔥 NEW FILTER (optional for coaching later)
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        message: "average rating is produced successfully",
        averageRating: result[0].averageRating,
      });
    }

    // SAME RESPONSE AS BEFORE
    return res.status(200).json({
      success: true,
      message: "Average Rating is 0, no ratings given till now",
      averageRating: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "some error in producing the average rating",
    });
  }
};





exports.getAllRatingAndReviews = async (req, res) => {
  try {
    const { forType = "Course" } = req.query; // optional filter

    const allRatingAndReviews = await ratingAndReviews
      .find({ forType }) // 🔥 NEW FILTER (optional)
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        select: "firstName lastName email imageUrl",
      })
      .populate({
        path: "course",
        select: "courseName thumbnail price",
      })
      .exec();

    // SAME RESPONSE AS BEFORE (UI SAFE)
    return res.status(200).json({
      success: true,
      message: "All rating andreviews are fetched successfully",
      data: allRatingAndReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "some error occurs on fetching all the rating and reviews data from the dataBase",
    });
  }
};
