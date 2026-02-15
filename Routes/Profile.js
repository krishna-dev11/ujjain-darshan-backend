const express = require("express")
const router = express.Router();

const {updateProfile , getAllUserDetails , updateDisplayPicture , deleteAccount , getAllEnrolledCourses , getAllCoursesOfInstructorForInstructorDashBoard , GetInstructorDasboardData} = require('../Controllers/Profile')
// Middleware
const {auth , isStudent , isInstructor , isAdmin} = require("../Middlewares/auth")


router.put('/updateProfile' , auth ,  updateProfile)
router.get('/getAllUserDetails' , auth ,  getAllUserDetails)
router.put('/updateDisplayPicture' , auth ,  updateDisplayPicture)
router.delete('/deleteAccount' , auth ,  deleteAccount)
router.get('/getAllEnrolledCourses' , auth ,  getAllEnrolledCourses )
router.get("/getAllCoursesOfInstructorForInstructorDashBoard" , auth , isInstructor , getAllCoursesOfInstructorForInstructorDashBoard)
router.get('/GetInstructorDasboardData' , auth , isInstructor ,  GetInstructorDasboardData )



module.exports = router