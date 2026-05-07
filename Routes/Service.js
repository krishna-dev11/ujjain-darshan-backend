const express = require("express")
const router = express.Router();

// Controllers
const {
  createService,          // 👉 createBatch
  showAllService,         // 👉 getAllBatches
  editService,            // 👉 updateBatch
  getAllDetailsOfOneService, // 👉 getSingleBatchWithStudents
  publishService,         // 👉 publishBatch
  getAllProviderServices,
  deleteProviderService,  // 👉 deleteBatch

  getBookedServicesDataForCardViews,
  getBookingCartServicesData,
  addServiceToBookingCart,
  removeServiceFromBookingCart,
  emptyBookingCart,
  updateServiceProgress,
  getServiceMediaWatchedDuration,
  getTotalServiceDuration,
  getServiceCompletionPercentage
} = require("../Controllers/serviceController")

const {
  creatcategory,
  getAllCategory,
  categoryPageDetails
} = require("../Controllers/Category")

const {
  createServiceSection,
  updateServiceSection,
  deleteServiceSection
} = require("../Controllers/serviceSectionController")

const {
  createServiceMedia,
  updateServiceMedia,
  deleteServiceMedia
} = require("../Controllers/serviceMediaController")

const {
  createTestimonialReview,
  getAverageTestimonialRating,
  getAllTestimonialReviews
} = require("../Controllers/testimonialReviewsController")

// middleware
const { auth, isStudent, isInstructor, isAdmin } = require("../Middlewares/auth")

// ==================
// 🔹 COURSE = BATCH ROUTES
// ==================

// CREATE BATCH (old: createService)
router.post('/createCourse', auth, isInstructor, createService)

// UPDATE BATCH (old: editService)
router.post('/editCourse', auth, isInstructor, editService)

// GET ALL BATCHES (old: showAllService)
router.get('/showAllCourse', showAllService)

// GET SINGLE BATCH WITH STUDENTS (old: getAllDetailsOfOneService)
router.post('/getAllDetailsOfOneCourse', getAllDetailsOfOneService)

// PUBLISH / DRAFT BATCH (old: publishService)
router.post('/publishCourse', auth, isInstructor, publishService)

// GET ALL BATCHES OF INSTRUCTOR
router.post('/getAllCoursesOfInstructor', auth, isInstructor, getAllProviderServices)

// DELETE BATCH (old: deleteProviderService)
router.post('/deleteCourseOfInstructor', auth, isInstructor, deleteProviderService)

// STUDENT COURSE (BATCH) RELATED ROUTES — SAME AS BEFORE (UI SAFE)
router.post('/getEnrolledCoursesDataForCardViews', auth, isStudent, getBookedServicesDataForCardViews)
router.post('/getCartCoursesData', auth, isStudent, getBookingCartServicesData)
router.post('/AddCourseInCart', auth, isStudent, addServiceToBookingCart)
router.post('/RemoveCourseInCart', auth, isStudent, removeServiceFromBookingCart)
router.post('/EmptyCart', auth, isStudent, emptyBookingCart)


// ==================
// 🔹 COURSE PROGRESS (UNCHANGED)
// ==================
router.post('/updateCourseProgress', auth, isStudent, updateServiceProgress)
router.post("/getWatchedDuration", getServiceMediaWatchedDuration);
router.post('/getTotalCourseDuration', getTotalServiceDuration);
router.post('/getCourseCompletionPercentage', auth, isStudent, getServiceCompletionPercentage)


// ==================
// 🔹 CATEGORY ROUTES (UNCHANGED)
// ==================
router.post('/creatcategory', auth, isAdmin, creatcategory)
router.get('/getAllCategory', getAllCategory)
router.post('/categoryPageDetails', categoryPageDetails)


// ==================
// 🔹 SECTION ROUTES (UNCHANGED)
// ==================
router.post('/createSection', auth, isInstructor, createServiceSection)
router.post('/updateSection', auth, isInstructor, updateServiceSection)
router.post('/deleteSection', auth, isInstructor, deleteServiceSection)


// ==================
// 🔹 SUBSECTION ROUTES (UNCHANGED)
// ==================
router.post('/createSubSection', auth, isInstructor, createServiceMedia)
router.post('/updateSubSection', auth, isInstructor, updateServiceMedia)
router.post('/deleteSubSection', auth, isInstructor, deleteServiceMedia)


// ==================
// 🔹 RATING ROUTES (UNCHANGED)
// ==================
router.post('/createRatingAndReviews', auth, isStudent, createTestimonialReview)
router.get('/getAverageRating', getAverageTestimonialRating)
router.get('/getAllRatingAndReviews', getAllTestimonialReviews)

module.exports = router
