const mongoose = require("mongoose");
const courses = require("../Models/courses");
const { instance } = require("../config/RazorpayInstance");
const user = require("../Models/user");
const { mailSender } = require("../Utilities/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmal");
const {
  paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");
const CourseProgress = require('../Models/ProgressCourse');
// require("dotenv").config()

exports.capturePayment = async (req, res) => {
  const { CoursesIds } = req.body;
  const userId = req.user.id;

  // console.log(CoursesIds, userId);

  if (CoursesIds.length === 0) {
    return res.json({ success: false, message: "Please provide Course Id" });
  }

  let totalAmount = 0;
  // console.log(CoursesIds, "captured");
  for (const course_id of CoursesIds) {
    try {
      const course = await courses.findById(course_id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Could not find the course",
        });
      }
      // console.log("for iteratie on caputre lopp");
      const uid = new mongoose.Types.ObjectId(userId);

      if (course.studentEnrolled.includes(uid)) {
        return res.status(400).json({
          success: false,
          message: `Student is already enrolled in course ${course.courseName}`,
        });
      }

      totalAmount += Number(course.price);
    } catch (error) {
      // console.error("Error in course loop:", error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong while checking courses",
        error: error.message,
      });
    }
  }

  // console.log(totalAmount, "krishns");

  // realitiy me order yanha create ho raha hai
  const currency = "INR";
  const options = {
    amount: totalAmount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
  };

  // console.log("navratri");

  try {
    const paymentResponse = await instance.orders.create(options);
    // console.log( paymentResponse)

    res.json({
      success: true,
      message: paymentResponse,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, mesage: "Could not Initiate Order" });
  }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;

  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the fields" });
  }

  try {
    //student ko dhundo
    const enrolledStudent = await user.findById(userId);
    await mailSender(
      enrolledStudent.email,
      `Payment Recieved`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );
    // console.log("send mail");
  } catch (error) {
    console.log("error in sending mail", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not send email" });
  }
};

//verify the payment
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;
  const Courses = req.body?.CoursesIds;
  const userId = req.user.id;

  // console.log(Courses, "verify");

  console.log(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    Courses,
    userId
  );

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !Courses ||
    !userId
  ) {
    // console.log("hi");
    return res.status(200).json({ success: false, message: "Payment Failed" });
  }

  // console.log("krishna1");
  let body = razorpay_order_id + "|" + razorpay_payment_id;

  // console.log(process.env.RAZORPAY_SECRET, "krishna3");
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  // console.log("signature", razorpay_signature);

  if (expectedSignature === razorpay_signature) {
    //enroll karwao student ko
    await enrollStudents(Courses, userId, res);

    // emtying the cart
    const updatedUser = await user
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            cart: [],
          },
        },
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

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in the database",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course Removed from cart successfully",
      data: updatedUser,
    });

    // //return res
    // return res.status(200).json({success:true, message:"Payment Verified"});
  }
  return res.status(200).json({ success: "false", message: "Payment Failed" });
};

const enrollStudents = async (Courses, userId, res) => {
  if (!Courses || !userId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Please Provide data for Courses or UserId",
      });
  }

  // console.log(Courses, "Enrolled Students");

  for (const courseId of Courses) {
    try {
      //find the course and enroll the student in it
      const enrolledCourse = await courses.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentEnrolled: userId } },
        { new: true }
      );
      console.log("for checkin");
      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, message: "Course not Found" });
      }

// payment ke vakt course progress initialize ki bcoz abhi abhi course progress null hai
      const courseProgress = await CourseProgress.create({
        courseId:courseId,
        userId:userId,
        completedVideos : [],
    })



      //find the student and add the course to their list of enrolledCOurses
      const enrolledStudent = await user.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            coursesProgress: courseProgress._id,
          },
        },
        { new: true }
      );

      ///bachhe ko mail send kardo
      const emailResponse = await mailSender(
        enrollStudents.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName}`
        )
      );
      //console.log("Email Sent Successfully", emailResponse.response);
    } catch (error) {
      // console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
