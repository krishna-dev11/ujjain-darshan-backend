const express = require("express")
const router = express.Router();

const {updateProfile , getAllUserDetails , updateDisplayPicture , deleteAccount , getAllEnrolledCourses , getAllProviderServicesForInstructorDashBoard , GetInstructorDasboardData} = require('../Controllers/Profile')
// Middleware
const {auth , isStudent , isInstructor , isAdmin} = require("../Middlewares/auth")


router.put('/updateProfile' , auth ,  updateProfile)
router.get('/getAllUserDetails' , auth ,  getAllUserDetails)
router.get('/getUserDetails' , auth ,  getAllUserDetails)
router.put('/updateDisplayPicture' , auth ,  updateDisplayPicture)
router.delete('/deleteAccount' , auth ,  deleteAccount)
router.get('/getAllEnrolledCourses' , auth ,  getAllEnrolledCourses )
router.get('/getEnrolledCourses' , auth ,  getAllEnrolledCourses )
router.get("/getAllProviderServicesForInstructorDashBoard" , auth , isInstructor , getAllProviderServicesForInstructorDashBoard)
router.get("/getAllCoursesOfInstructorForInstructorDashBoard" , auth , isInstructor , getAllProviderServicesForInstructorDashBoard)
router.get('/GetInstructorDasboardData' , auth , isInstructor ,  GetInstructorDasboardData )



module.exports = router
