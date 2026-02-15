const user = require("../Models/user");
const Profile = require("../Models/profile");
const {
  uploadImageToCloudinary,
} = require("../Utilities/uploadImageToCloudinary");
const profile = require("../Models/profile");
const courses = require("../Models/courses");
const expense = require("../Models/expenseSchema");
const enrollment = require("../Models/enrollmentSchema")
const demoRequest = require("../Models/demoRequestSchema")

require("dotenv").config();

// check
exports.updateProfile = async (req, res) => {
  try {
    // console.log(req.body ,"hiiiiiii")
    const {
      gender,
      dateOfBirth = "",
      about = "",
      contactNumber,
      FirstName,
      LastName,
    } = req.body;

    const userId = req.user.id;

    if (
      !gender ||
      !dateOfBirth ||
      !about ||
      !contactNumber ||
      !FirstName ||
      !LastName
    ) {
      return res.status(400).json({
        success: false,
        message: "please fills all details carefully",
      });
    }

    const existingUser = await user.findById({ _id: userId });
    const profile = await Profile.findById(existingUser.additionalDetails);

    existingUser.firstName = FirstName;
    existingUser.lastName = LastName;
    await existingUser.save();

    profile.dateOfBirth = dateOfBirth;
    profile.about = about;
    profile.contactNumber = contactNumber;
    profile.gender = gender;
    await profile.save();

    const updatedUser = await user.findById(userId).populate([
      {
        path: "additionalDetails",
      },
      {
        path: "cart",
        populate: {
          path: "instructor",
        },
      },
      {
        path: "coursesProgress",
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "additional details submitted successfully",
      profile,
      data: updatedUser,
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      success: false,
      message: "some errors occurs in updating the additional details",
      error: error.message,
    });
  }
};

// check
exports.getAllUserDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const getalldetails = await user
      .findById({ _id: userId })
      .populate("additionalDetails cart coursesProgress")
      .exec();
    // console.log(getalldetails);

    if (!getalldetails) {
      return res.status(400).json({
        success: false,
        message: "user with these ID is not exist in our databases",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All Details of user fetched successfully from the databse",
      data: getalldetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "some errors occurs on fetching the All Details of user from the Databases",
    });
  }
};

// check
exports.updateDisplayPicture = async (req, res) => {
  try {
    const profilePicture = req.files.displayPicture;

    const userId = req.user.id;

    // console.log(profilePicture , userId , "alakh")
    const image = await uploadImageToCloudinary(
      profilePicture,
      process.env.CLOUDINARY_FOLDER,
      1000,
      1000
    );

    const updateprofilePicture = await user
      .findByIdAndUpdate(
        { _id: userId },
        { imageUrl: image.secure_url },
        { new: true }
      )
      .populate([
        {
          path: "additionalDetails",
        },
        {
          path: "cart",
          populate: {
            path: "instructor",
          },
        },
        {
          path: "coursesProgress",
        },
      ]);

    return res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: updateprofilePicture,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "some error occurs in Uploding the new profile Picture",
    });
  }
};

// check but body me id pass karke
exports.deleteAccount = async (req, res) => {
  try {
    // console.log(req.user)
    const userId = req.user.id;
    // const userId = req.body.id

    const checkUser = await user.findById({ _id: userId });
    if (!checkUser) {
      return res.status(400).json({
        success: false,
        message: "user Not Found",
      });
    }

    const deleteAdditionalDetails = await profile.findByIdAndDelete({
      _id: checkUser.additionalDetails,
    });

    const deleteAccount = await user.findByIdAndDelete({ _id: userId });

    return res.status(200).json({
      success: true,
      message: "user Deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "some Error Occurs in deleting the User",
    });
  }
};

exports.getAllEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const userDetails = await user
      .find({ _id: userId })
      .populate("courses  ")
      .exec();

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "Could Not Find the User along with these UserId",
      });
    }

    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// instructor Dashboard

exports.GetInstructorDasboardData = async (req, res) => {
  try {
    const InstructorId = req.user.id;

    // ===== BASIC COURSE DATA =====
    const InsrtuctorAllCourses = await courses
      .find({ instructor: InstructorId })
      .populate("studentEnrolled", "firstName lastName createdAt")
      .lean();

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const currentMonthEnd = new Date();

    // ===== PER-COURSE METRICS (UI SAFE) =====
    const CourseData = InsrtuctorAllCourses.map((course) => {
      const totalStudentsEnrolled = course.studentEnrolled.length;
      const totalAmountEarned =
        totalStudentsEnrolled * Number(course.price || 0);

      // Students enrolled THIS MONTH
      const studentsThisMonth = course.studentEnrolled.filter(
        (s) =>
          new Date(s.createdAt) >= currentMonthStart &&
          new Date(s.createdAt) <= currentMonthEnd
      ).length;

      return {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentsEnrolled,
        studentsThisMonth,
        totalAmountEarned,
        batchStatus: course.batchStatus,
        isOfflineBatch: course.isOfflineBatch,
      };
    });

    // ===== BATCH INSIGHTS =====
    const totalBatches = InsrtuctorAllCourses.filter(
      (c) => c.isOfflineBatch === true
    ).length;

    const activeBatches = InsrtuctorAllCourses.filter(
      (c) => c.batchStatus === "Ongoing"
    ).length;

    const upcomingBatches = InsrtuctorAllCourses.filter(
      (c) => c.batchStatus === "Upcoming"
    ).length;

    const completedBatches = InsrtuctorAllCourses.filter(
      (c) => c.batchStatus === "Completed"
    ).length;

    // ===== DEMO REQUESTS =====
    const pendingDemos = await demoRequest.countDocuments({
      status: "Pending",
      instructor: InstructorId,
    });

    const completedDemos = await demoRequest.countDocuments({
      status: "Completed",
      instructor: InstructorId,
    });

    // ===== REVENUE THIS MONTH =====
    const enrollments = await enrollment.find({
      instructor: InstructorId,
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });

    const totalRevenueCurrentMonth = enrollments.reduce(
      (acc, e) => acc + (e.totalFee || 0),
      0
    );

    // ===== EXPENSES THIS MONTH =====
    const expenses = await expense.find({
      addedBy: InstructorId,
      expenseDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
    });

    const totalExpensesCurrentMonth = expenses.reduce(
      (acc, e) => acc + (e.amount || 0),
      0
    );

    const netProfit = totalRevenueCurrentMonth - totalExpensesCurrentMonth;

    // ===== GROWTH METRICS =====
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const lastMonthEnd = new Date();
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);
    lastMonthEnd.setDate(31);

    const lastMonthEnrollments = await enrollment.find({
      instructor: InstructorId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    const lastMonthRevenue = lastMonthEnrollments.reduce(
      (acc, e) => acc + (e.totalFee || 0),
      0
    );

    const revenueGrowth =
      lastMonthRevenue === 0
        ? 100
        : ((totalRevenueCurrentMonth - lastMonthRevenue) /
            lastMonthRevenue) *
          100;

    return res.status(200).json({
      success: true,
      message: "Instructor Dashboard Data Fetched Successfully",

      data: CourseData, // OLD UI SAFE

      dashboardExtras: {
        totalBatches,
        activeBatches,
        upcomingBatches,
        completedBatches,
        pendingDemos,
        completedDemos,
        totalRevenueCurrentMonth,
        totalExpensesCurrentMonth,
        netProfit,
        revenueGrowth: revenueGrowth.toFixed(2),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




exports.getAllCoursesOfInstructorForInstructorDashBoard = async (req, res) => {
  try {
    const InstructorId = req.user.id;

    const CoursesData = await courses
      .find({ instructor: InstructorId })
      .populate("studentEnrolled", "firstName lastName createdAt")
      .lean();

    if (!CoursesData) {
      return res.status(400).json({
        success: false,
        message: "Courses Data Not Found",
      });
    }

    const enrichedCourses = CoursesData.map((course) => {
      const totalStudents = course.studentEnrolled.length;

      const today = new Date();
      const studentsLast7Days = course.studentEnrolled.filter(
        (s) =>
          new Date(s.createdAt) >=
          new Date(today.setDate(today.getDate() - 7))
      ).length;

      return {
        ...course,
        isActiveBatch: course.batchStatus === "Ongoing",
        isOfflineBatch: course.isOfflineBatch || false,
        totalStudents,
        studentsLast7Days,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Instructor courses fetched successfully",
      data: enrichedCourses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Error fetching instructor courses",
    });
  }
};
