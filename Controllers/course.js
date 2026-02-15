const user = require("../Models/user");
const Category = require("../Models/category");
const courses = require("../Models/courses");
const {
  uploadImageToCloudinary,
} = require("../Utilities/uploadImageToCloudinary");
const { json } = require("express");
// const { path } = require("framer-motion/client");
const section = require("../Models/section");
const subsection = require("../Models/subsection");
const { default: mongoose } = require("mongoose");
const courseprogress = require("../Models/ProgressCourse");
// const { convertSecondsToDuration } = require("../Utilities/SecondsToDuration");


function convertSecondsToDuration(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const duration = []
  if (hrs > 0) duration.push(`${hrs}h`)
  if (mins > 0) duration.push(`${mins}m`)
  if (hrs === 0 && mins === 0) duration.push(`${secs}s`)

  return duration.join(" ")
}


// checked
exports.createCourse = async (req, res) => {


  try {
    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag,
      category,
      status,
      instructions,

      // -------- NEW BATCH FIELDS (OPTIONAL) --------
      isOfflineBatch,
      batchStartDate,
      batchEndDate,
      batchTiming,
      maxSeats,
      batchStatus,
      enrollmentOpen,
    } = req.body;

    console.log(req.body , 'tappu')

    const thumbnail = req.files?.thumbnailImage || req.body?.thumbnailImage;

    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !thumbnail ||
      !category ||
      !instructions
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all details completely and carefully",
      });
    }

    // Default status (Course publish status)
    if (!status) {
      status = "Draft";
    }

    // Check if user is an instructor
    const userId = req.user.id;
    const checkInstructor = await user.findById(userId);

    if (!checkInstructor || checkInstructor.accountType !== "Instructor") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create a course.",
      });
    }

    

    // Check if category exists
    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(400).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Upload thumbnail to Cloudinary
    const uploadThumbnail = await uploadImageToCloudinary(
      thumbnail,
      process.env.CLOUDINARY_FOLDER
    );


    // -------- CREATE COURSE (NOW ACTING AS BATCH) --------
    const newCourse = await courses.create({
      courseName,
      courseDescription,
      price,

      // Keep your old parsing logic (UI dependent)   bhai yanha changes kiya hai mene json.parse(teno)
      whatYouWillLearn: whatYouWillLearn ,
      tag: tag,
      instructions: instructions,

      instructor: checkInstructor._id,
      thumbnail: uploadThumbnail.secure_url,
      category: categoryDetails._id,
      status: status,

      // -------- NEW BATCH FIELDS (SAFE ADDITIONS) --------
      isOfflineBatch: isOfflineBatch === "true" || isOfflineBatch === true,

      batchStartDate: batchStartDate || null,
      batchEndDate: batchEndDate || null,
      batchTiming: batchTiming || null,
      maxSeats: maxSeats ? Number(maxSeats) : null,
      batchStatus: batchStatus || "Upcoming",
      enrollmentOpen:
        enrollmentOpen === undefined
          ? true
          : enrollmentOpen === "true" || enrollmentOpen === true,
    });

    // Update instructor with new course (OLD UI DEPENDENCY SAFE)
    await user.findByIdAndUpdate(
      checkInstructor._id,
      { $push: { courses: newCourse._id } },
      { new: true }
    );

    // Update category with new course (OLD UI DEPENDENCY SAFE)
    await Category.findByIdAndUpdate(
      category,
      { $push: { course: newCourse._id } },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      data: newCourse,      // <-- SAME AS BEFORE (UI SAFE)
      message: "Course created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create course.",
      error: error.message,
    });
  }
};




exports.editCourse = async (req, res) => {
  try {
    let {
      courseId,
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag,
      category,
      status,
      instructions,

      // -------- NEW BATCH FIELDS (OPTIONAL) --------
      isOfflineBatch,
      batchStartDate,
      batchEndDate,
      batchTiming,
      maxSeats,
      batchStatus,
      enrollmentOpen,
    } = req.body;

    const thumbnail = req.body.thumbnailImage || req.files?.thumbnailImage;

    if (
      !courseId ||
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !thumbnail ||
      !category ||
      !instructions
    ) {
      return res.status(400).json({
        success: false,
        message: "fill all details completely and carefully",
      });
    }

    if (!status || status === undefined) {
      status = "Draft";
    }

    // Check instructor
    const userId = req.user.id;
    const checkInstructor = await user.findById(userId);

    if (!checkInstructor || checkInstructor.accountType !== "Instructor") {
      return res.status(400).json({
        success: false,
        message:
          "You are not assigned as an instructor, only instructors can edit batches.",
      });
    }

    // Check category
    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(400).json({
        success: false,
        message: "Category not found in Category schema",
      });
    }

    // Upload new thumbnail only if new file is provided
    let uploadthumbnail;
    if (!req.body.thumbnailImage) {
      uploadthumbnail = await uploadImageToCloudinary(
        thumbnail,
        process.env.CLOUDINARY_FOLDER
      );
    }

    // Find existing course (batch)
    const editCourse = await courses.findById(courseId);

    if (!editCourse) {
      return res.status(404).json({
        success: false,
        message: "Course (Batch) not found",
      });
    }

    // -------- UPDATE OLD FIELDS (UI SAFE) --------
    editCourse.courseName = courseName;
    editCourse.courseDescription = courseDescription;
    editCourse.price = price;

    editCourse.whatYouWillLearn =
      typeof whatYouWillLearn === "string"
        ? JSON.parse(whatYouWillLearn)
        : whatYouWillLearn;

    editCourse.instructor = checkInstructor._id;

    editCourse.thumbnail = uploadthumbnail
      ? uploadthumbnail.secure_url
      : thumbnail;

    editCourse.tag =
      typeof tag === "string" ? JSON.parse(tag) : tag;

    editCourse.category = categoryDetails._id;
    editCourse.status = status;

    editCourse.instructions =
      typeof instructions === "string"
        ? JSON.parse(instructions)
        : instructions;

    // -------- NEW BATCH FIELDS (SAFE ADDITIONS) --------
    if (isOfflineBatch !== undefined) {
      editCourse.isOfflineBatch =
        isOfflineBatch === "true" || isOfflineBatch === true;
    }

    if (batchStartDate) editCourse.batchStartDate = batchStartDate;
    if (batchEndDate) editCourse.batchEndDate = batchEndDate;
    if (batchTiming) editCourse.batchTiming = batchTiming;
    if (maxSeats) editCourse.maxSeats = Number(maxSeats);
    if (batchStatus) editCourse.batchStatus = batchStatus;

    if (enrollmentOpen !== undefined) {
      editCourse.enrollmentOpen =
        enrollmentOpen === "true" || enrollmentOpen === true;
    }

    await editCourse.save();

    // Final populated response (same as your old controller)
    const finaleditedCourse = await courses
      .findById(courseId)
      .populate({
        path: "courseContent",
        populate: { path: "subSections" },
      });

    return res.status(200).json({
      success: true,
      data: finaleditedCourse, // <-- SAME AS BEFORE (UI SAFE)
      message: "course updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update course",
      error: error.message,
    });
  }
};




// checked
exports.showAllCourse = async (req, res) => {
  try {
    const { 
      isOfflineBatch, 
      batchStatus, 
      category 
    } = req.query;

    // Build filter dynamically (safe enhancement)
    let filter = {};

    if (isOfflineBatch !== undefined) {
      filter.isOfflineBatch =
        isOfflineBatch === "true" || isOfflineBatch === true;
    }

    if (batchStatus) {
      filter.batchStatus = batchStatus;
    }

    if (category) {
      filter.category = category;
    }

    const allcourses = await courses
      .find(
        filter,
        {
          courseName: true,
          price: true,
          thumbnail: true,
          instructor: true,
          ratingAndReviews: true,
          studentEnrolled: true,

          // ----- NEW (Batch fields will also be returned automatically) -----
          isOfflineBatch: true,
          batchStartDate: true,
          batchEndDate: true,
          batchTiming: true,
          maxSeats: true,
          batchStatus: true,
          enrollmentOpen: true,
        }
      )
      .populate("instructor")
      .exec();

    if (!allcourses || allcourses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Neither any course/batch is present",
      });
    }

    return res.status(200).json({
      success: true,
      data: allcourses,   // <-- SAME KEY AS BEFORE (UI SAFE)
      message: "All courses (batches) fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occurred in fetching all courses",
      error: error.message,
    });
  }
};




// error
exports.getAllDetailsOfOneCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const allDetails = await courses
      .findById(courseId)
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate({
        path: "courseContent",
        populate: {
          path: "subSections",
        },
      })
      .populate("ratingAndReviews")
      .populate("category")

      // ----- NEW (for coaching/batch) -----
      .populate({
        path: "studentEnrolled",
        populate: {
          path: "additionalDetails",
        },
      });

    if (!allDetails) {
      return res.status(400).json({
        success: false,
        message: "Course (Batch) Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All details of this course/batch fetched successfully",
      data: allDetails, // <-- SAME KEY AS BEFORE (UI SAFE)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Some error occurred while fetching course (batch) details",
      error: error.message,
    });
  }
};




exports.publishCourse = async (req, res) => {
  try {
    const { courseId, status, TeachLive } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    // Normalize values (safe way — no const mutation)
    const finalStatus = status || "Draft";
    const finalTeachLive =
      TeachLive === undefined ? false : Boolean(TeachLive);

    // Find course (batch)
    const editCourse = await courses.findById(courseId);
    if (!editCourse) {
      return res.status(404).json({
        success: false,
        message: "Course (Batch) not found",
      });
    }

    // ---- OLD BEHAVIOR (UI SAFE) ----
    editCourse.status = finalStatus;
    editCourse.TeachLive = finalTeachLive;

    // ---- NEW (BATCH ENHANCEMENT) ----
    // Auto-map course status → batchStatus
    if (finalStatus === "Published") {
      editCourse.batchStatus = "Ongoing";
    } else if (finalStatus === "Draft") {
      editCourse.batchStatus = "Upcoming";
    }

    await editCourse.save();

    // Same populated response as your old controller
    const finaleditedCourse = await courses
      .findById(courseId)
      .populate({
        path: "courseContent",
        populate: { path: "subSections" },
      });

    return res.status(200).json({
      success: true,
      data: finaleditedCourse, // <-- SAME KEY AS BEFORE (UI SAFE)
      message: `Course ${finalStatus} successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to Publish/Draft course",
      error: error.message,
    });
  }
};





exports.getAllCoursesOfInstructor = async (req, res) => {
  try {
    const { InstructorId } = req.body;

    if (!InstructorId) {
      return res.status(400).json({
        success: false,
        message: "InstructorId is required",
      });
    }

    const CoursesData = await user
      .findById(InstructorId)
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

      // console.log(CoursesData)

    if (!CoursesData) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All instructor courses fetched successfully",
      data: CoursesData,
    });
  } catch (error) {
    console.error("Error in getAllCoursesOfInstructor:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message:
        "Error while fetching instructor courses",
    });
  }
};



exports.deleteCourseOfInstructor = async (req, res) => {
  try {
    const { InstructorId, CourseId } = req.body;

    if (!InstructorId || !CourseId) {
      return res.status(400).json({
        success: false,
        message: "InstructorId and CourseId are required",
      });
    }

    // Check if course exists before deleting
    const courseExists = await courses.findById(CourseId);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: "Course (Batch) not found",
      });
    }

    // Remove course from instructor's list
    const CoursesData = await user
      .findByIdAndUpdate(
        InstructorId,
        {
          $pull: { courses: CourseId },
        },
        { new: true }
      )
      .populate([
        {
          path: "courses",
          populate: [
            { path: "courseContent", populate: { path: "subSections" } },
            { path: "ratingAndReviews" },
            { path: "studentEnrolled" },
          ],
        },
        {
          path: "additionalDetails",
        },
      ])
      .exec();

    if (!CoursesData) {
      return res.status(400).json({
        success: false,
        message: "Instructor data not found",
      });
    }

    // Delete the course (batch)
    await courses.findByIdAndDelete(CourseId);

    return res.status(200).json({
      success: true,
      message: "Course (Batch) deleted successfully",
      data: CoursesData, // <-- SAME AS BEFORE (UI SAFE)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Some error occurred while deleting the course (batch)",
      error: error.message,
    });
  }
};




// exports.getEnrolledCoursesDataForCardViews = async (req, res) => {
//   try {
//     const { StudentId } = req.body;

//     if (!StudentId) {
//       return res.status(400).json({
//         success: false,
//         message: "StudentId is required",
//       });
//     }

//     const Sid = new mongoose.Types.ObjectId(StudentId);

//     const userData = await user.findById({_id:StudentId})
//       .populate([
//         {
//           path: "courses",
//           populate:{
//             path:"instructor"
//           },
//           populate:{
//                         path:"courseContent"
//           }
  
//         },
//         {
//           path: "coursesProgress",
//         }
//       ])
//       .exec();


      

//     if (!userData) {
//       return res.status(404).json({
//         success: false,
//         message: "User data not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Courses and Progress data fetched successfully",
//       data: userData,
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching course data",
//       error: error.message,
//     });
//   }
// };


exports.getEnrolledCoursesDataForCardViews = async (req, res) => {
  try {
    const { StudentId } = req.body;

    if (!StudentId) {
      return res.status(400).json({
        success: false,
        message: "StudentId is required",
      });
    }

    const Sid = new mongoose.Types.ObjectId(StudentId);

    let userData = await user.findById(Sid)
      .populate({
        path: "courses",
        populate: [
          {
            path: "instructor",
          },
          {
            path: "courseContent",
            populate: {
              path: "subSections",
            },
          },
        ],
      })
      .exec();

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User data not found",
      });
    }

    userData = userData.toObject();

    for (let i = 0; i < userData.courses.length; i++) {
      let totalDurationInSeconds = 0;
      let totalSubsections = 0;

      for (let j = 0; j < userData.courses[i].courseContent.length; j++) {
        const subSections = userData.courses[i].courseContent[j].subSections;
        totalSubsections += subSections.length;
        totalDurationInSeconds += subSections.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration || 0),
          0
        );
      }

      userData.courses[i].totalDuration = convertSecondsToDuration(totalDurationInSeconds);

      let CourseProgress = await courseprogress.findOne({
        courseId: userData.courses[i]._id,
        userId: Sid,
      });

      const completedCount = CourseProgress?.completedVideos?.length || 0;

      userData.courses[i].progressPercentage = totalSubsections === 0
        ? 100
        : Math.round((completedCount / totalSubsections) * 10000) / 100;
    }

    return res.status(200).json({
      success: true,
      message: "Courses and progress data fetched successfully",
      data: userData,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course data",
      error: error.message,
    });
  }
};

exports.getCartCoursesData = async (req, res) => {
  try {
    const { CoursesIds } = req.body;

    if (!CoursesIds) {
      return res.status(400).json({
        success: false,
        message: "CoursesIds is required",
      });
    }

    const CoursesData = []

    for(const course_id of CoursesIds) {
      let course;
      try{
         
          course = await courses.findById(course_id);
          if(!course) {
              return res.status(200).json({success:false, message:"Could not find the course"});
          }

        CoursesData.push(course)
      }
      catch(error) {
          console.log(error);
          return res.status(500).json({success:false, message:error.message});
      }
  }

  return res.status(200).json({
    success:true,
    message:" cart courses Fetched Successfully",
    data : CoursesData
  })

    }catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course data",
      error: error.message,
    });
  }
};

exports.AddCourseInCart = async (req, res) => {
  try {
    const { CourseId, UserID } = req.body;

    // console.log(req.body);

    if (!CourseId || !UserID) {
      return res.status(400).json({
        success: false,
        message: "CourseId and UserID are required",
      });
    }

    const User = await user.findById(UserID).populate("cart").exec();

    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User not found in the database",
      });
    }

    const isAlreadyInCart = User.cart.some((course) =>
      course._id.toString() === CourseId
    );

    if (isAlreadyInCart) {
      return res.status(400).json({
        success: false,
        message: "Course already exists in the cart",
      });
    }

    const updatedUser = await user.findByIdAndUpdate(
      UserID,
      {
        $push: {
          cart: new mongoose.Types.ObjectId(CourseId),
        },
      },
      { new: true }
    ).populate([
      {
        path:"additionalDetails"
      },{
        path:"cart",
        populate:{
          path:"instructor"
        }
      },{
        path:"coursesProgress"
      }
    ])

    return res.status(200).json({
      success: true,
      message: "Course added to cart successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while adding course to cart",
      error: error.message,
    });
  }
};


exports.RemoveCourseInCart = async (req, res) => {
  try {
    const { CourseId , UserID } = req.body;

    // console.log(req.body);

    if (!CourseId || !UserID) {
      return res.status(400).json({
        success: false,
        message: "CourseId and UserID are required",
      });
    }

    
    const updatedUser = await user.findByIdAndUpdate(
      UserID,
      {
        $pull : {
          cart: new mongoose.Types.ObjectId(CourseId),
        },
      },
      { new: true }
    ).populate([
      {
        path:"additionalDetails"
      },{
        path:"cart",
        populate:{
          path:"instructor"
        }
      },{
        path:"coursesProgress"
      }
    ])

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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while adding course to cart",
      error: error.message,
    });
  }
};

exports.EmptyCart = async (req, res) => {
  try {
    const {  UserID } = req.body;

    // console.log(req.body  , " ha bhai sabh badhiya hai");

    if ( !UserID) {
      return res.status(400).json({
        success: false,
        message: "UserID are required",
      });
    }

    
    const updatedUser = await user.findByIdAndUpdate(
      UserID,
      {
        $set: {
          cart: []
        },
      },
      { new: true }
    ).populate([
      {
        path: "additionalDetails"
      },
      {
        path: "cart",
        populate: {
          path: "instructor"
        }
      },{
        path:"coursesProgress"
      }
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while adding course to cart",
      error: error.message,
    });
  }
};


exports.updateCourseProgress = async(req,res) => {
  const {courseId, subSectionId} = req.body;
  const userId = req.user.id;

  try{
      //check if the subsection is valid
      const subSection = await subsection.findById(subSectionId);

      if(!subSection) {
          return res.status(404).json({error:"Invalid SUbSection"});
      }

      // console.log("SubSection Validation Done");

      //check for old entry 
      let CourseProgress = await courseprogress.findOne({
          courseId:courseId,
          userId:userId,
      });
      if(!CourseProgress) {
          return res.status(404).json({
              success:false,
              message:"Course Progress does not exist"
          });
      }
      else {
          // console.log("Course Progress Validation Done");

          if(CourseProgress.completedVideos.includes(subSectionId)) {
              return res.status(400).json({
                  error:"Subsection already completed",
              });
          }

          CourseProgress.completedVideos.push(subSectionId);
          // console.log("Copurse Progress Push Done");
      }
      await CourseProgress.save();

      const updatedUser = await user.findById(userId).populate([
        {
          path: "additionalDetails"
        },
        {
          path: "cart",
          populate: {
            path: "instructor"
          }
        },{
          path:"coursesProgress"
        }
      ]);


      // console.log("Course Progress Save call Done");
      return res.status(200).json({
          success:true,
          message:"Course Progress Updated Successfully",
          data:updatedUser
      })
  }
  catch(error) {
      console.error(error);
      return res.status(400).json({error:"Internal Server Error"});
  }
}



// course progress nikala 
exports.getWatchedDuration = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "userId and courseId are required",
      });
    }

    const userProgress = await courseprogress.findOne({ userId, courseId });

    if (!userProgress || userProgress.completedVideos.length === 0) {
      return res.status(200).json({
        success: true,
        watchedDurationMs: 0,
        watchedDurationFormatted: "0s",
        message: "No videos completed yet",
      });
    }

    const completedSubSections = await subsection.find({
      _id: { $in: userProgress.completedVideos },
    });

    let totalMs = 0;

    for (const sub of completedSubSections) {
      if (typeof sub.timeDuration === "string" && sub.timeDuration.includes(".")) {
        const [secStr, msStr = "0"] = sub.timeDuration.split(".");
        const sec = Number(secStr);
        const ms = Number("0." + msStr) * 1000; // ✅ Correct way to get ms from decimal part
        totalMs += sec * 1000 + ms;
      }
    }

    const totalSec = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;

    const formatted = `${minutes > 0 ? minutes + "m " : ""}${seconds}s`;

    return res.status(200).json({
      success: true,
      watchedDurationMs: Math.round(totalMs),
      watchedDurationFormatted: formatted,
    });
  } catch (error) {
    console.error("Error calculating watched time:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.getTotalCourseDuration = async (req, res) => {
  try {
    const { courseId } = req.body; // Get courseId from request

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    // Step 1: Find course details by courseId
    const course = await courses.findById(courseId).populate({
      path: "courseContent", // Populate the sections in the course
      populate: {
        path: "subSections", // Populate the subsections in each section
        model: "subSection",
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let totalMs = 0;

    // Step 2: Calculate total duration of all subsections in the course
    for (const section of course.courseContent) {
      for (const sub of section.subSections) {
        if (typeof sub.timeDuration === "string" && sub.timeDuration.includes(".")) {
          const [secStr, msStr = "0"] = sub.timeDuration.split(".");
          const sec = Number(secStr);
          const ms = Number("0." + msStr) * 1000; // Convert milliseconds
          totalMs += sec * 1000 + ms;
        }
      }
    }

    // Step 3: Convert total time in milliseconds to readable format (e.g., "10m 30s")
    const totalSec = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;

    const formatted = `${minutes > 0 ? minutes + "m " : ""}${seconds}s`;

    return res.status(200).json({
      success: true,
      totalDurationMs: totalMs,
      totalDurationFormatted: formatted,
    });
  } catch (error) {
    console.error("Error calculating course duration:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.getCourseCompletionPercentage = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "userId and courseId are required",
      });
    }

    // 1. Get User Progress
    const userProgress = await courseprogress.findOne({ userId, courseId });
    const completedVideoIds = userProgress?.completedVideos || [];

    // 2. Get Course Details and All SubSections
    const course = await courses.findById(courseId).populate({
      path: "courseContent",
      populate: {
        path: "subSections",
        model: "subSection",
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let totalCourseMs = 0;
    let watchedMs = 0;

    for (const section of course.courseContent) {
      for (const sub of section.subSections) {
        if (typeof sub.timeDuration === "string" && sub.timeDuration.includes(".")) {
          const [secStr, msStr = "0"] = sub.timeDuration.split(".");
          const sec = Number(secStr);
          const ms = Number("0." + msStr) * 1000;
          const durationMs = sec * 1000 + ms;
          totalCourseMs += durationMs;

          if (completedVideoIds.includes(sub._id.toString())) {
            watchedMs += durationMs;
          }
        }
      }
    }

    const watchedSec = Math.floor(watchedMs / 1000);
    const totalSec = Math.floor(totalCourseMs / 1000);

    const formatTime = (ms) => {
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min > 0 ? min + "m " : ""}${sec}s`;
    };

    const percentage = totalCourseMs > 0
      ? ((watchedMs / totalCourseMs) * 100).toFixed(2)
      : "0.00";

    return res.status(200).json({
      success: true,
      data:{
        totalDurationMs: totalCourseMs,
        totalDurationFormatted: formatTime(totalCourseMs),
        watchedDurationMs: Math.round(watchedMs),
        watchedDurationFormatted: formatTime(watchedMs),
        completionPercentage: Number(percentage)
      },
      message: "Course progress calculated successfully",
    });

  } catch (error) {
    console.error("Error calculating course completion percentage:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
