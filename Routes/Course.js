const express = require("express")
const router = express.Router();

// Controllers
const {
  createCourse,          // 👉 createBatch
  showAllCourse,         // 👉 getAllBatches
  editCourse,            // 👉 updateBatch
  getAllDetailsOfOneCourse, // 👉 getSingleBatchWithStudents
  publishCourse,         // 👉 publishBatch
  getAllCoursesOfInstructor,
  deleteCourseOfInstructor,  // 👉 deleteBatch

  getEnrolledCoursesDataForCardViews,
  getCartCoursesData,
  AddCourseInCart,
  RemoveCourseInCart,
  EmptyCart,
  updateCourseProgress,
  getWatchedDuration,
  getTotalCourseDuration,
  getCourseCompletionPercentage
} = require("../Controllers/course")

const {
  creatcategory,
  getAllCategory,
  categoryPageDetails
} = require("../Controllers/Category")

const {
  createSection,
  updateSection,
  deleteSection
} = require("../Controllers/Section")

const {
  createSubSection,
  updateSubSection,
  deleteSubSection
} = require("../Controllers/Subsection")

const {
  createRatingAndReviews,
  getAverageRating,
  getAllRatingAndReviews
} = require("../Controllers/RatingAndReviews")

// middleware
const { auth, isStudent, isInstructor, isAdmin } = require("../Middlewares/auth")

// ==================
// 🔹 COURSE = BATCH ROUTES
// ==================

// CREATE BATCH (old: createCourse)
router.post('/createCourse', auth, isInstructor, createCourse)

// UPDATE BATCH (old: editCourse)
router.post('/editCourse', auth, isInstructor, editCourse)

// GET ALL BATCHES (old: showAllCourse)
router.get('/showAllCourse', showAllCourse)

// GET SINGLE BATCH WITH STUDENTS (old: getAllDetailsOfOneCourse)
router.post('/getAllDetailsOfOneCourse', getAllDetailsOfOneCourse)

// PUBLISH / DRAFT BATCH (old: publishCourse)
router.post('/publishCourse', auth, isInstructor, publishCourse)

// GET ALL BATCHES OF INSTRUCTOR
router.post('/getAllCoursesOfInstructor', auth, isInstructor, getAllCoursesOfInstructor)

// DELETE BATCH (old: deleteCourseOfInstructor)
router.post('/deleteCourseOfInstructor', auth, isInstructor, deleteCourseOfInstructor)

// STUDENT COURSE (BATCH) RELATED ROUTES — SAME AS BEFORE (UI SAFE)
router.post('/getEnrolledCoursesDataForCardViews', auth, isStudent, getEnrolledCoursesDataForCardViews)
router.post('/getCartCoursesData', auth, isStudent, getCartCoursesData)
router.post('/AddCourseInCart', auth, isStudent, AddCourseInCart)
router.post('/RemoveCourseInCart', auth, isStudent, RemoveCourseInCart)
router.post('/EmptyCart', auth, isStudent, EmptyCart)


// ==================
// 🔹 COURSE PROGRESS (UNCHANGED)
// ==================
router.post('/updateCourseProgress', auth, isStudent, updateCourseProgress)
router.post("/getWatchedDuration", getWatchedDuration);
router.post('/getTotalCourseDuration', getTotalCourseDuration);
router.post('/getCourseCompletionPercentage', auth, isStudent, getCourseCompletionPercentage)


// ==================
// 🔹 CATEGORY ROUTES (UNCHANGED)
// ==================
router.post('/creatcategory', auth, isAdmin, creatcategory)
router.get('/getAllCategory', getAllCategory)
router.post('/categoryPageDetails', categoryPageDetails)


// ==================
// 🔹 SECTION ROUTES (UNCHANGED)
// ==================
router.post('/createSection', auth, isInstructor, createSection)
router.post('/updateSection', auth, isInstructor, updateSection)
router.post('/deleteSection', auth, isInstructor, deleteSection)


// ==================
// 🔹 SUBSECTION ROUTES (UNCHANGED)
// ==================
router.post('/createSubSection', auth, isInstructor, createSubSection)
router.post('/updateSubSection', auth, isInstructor, updateSubSection)
router.post('/deleteSubSection', auth, isInstructor, deleteSubSection)


// ==================
// 🔹 RATING ROUTES (UNCHANGED)
// ==================
router.post('/createRatingAndReviews', auth, isStudent, createRatingAndReviews)
router.get('/getAverageRating', getAverageRating)
router.get('/getAllRatingAndReviews', getAllRatingAndReviews)

module.exports = router
