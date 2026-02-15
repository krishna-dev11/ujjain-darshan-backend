const express = require("express");
const router = express.Router();

// Controllers import
const {
  addWalkInStudent,
  updateWalkInStatus,
  scheduleFollowUp,
  convertWalkInToUser,
  getAllWalkIns
} = require("../Controllers/walkInController");

// Middleware
const { auth, isInstructor, isAdmin } = require("../Middlewares/auth");
const { addInstallment } = require("../Controllers/installmentController");

// Walk-In Routes

// Add walk-in student
router.post(
  "/addWalkInStudent",
  auth,
  isInstructor,
  addWalkInStudent
);

// Update walk-in status
// router.put(
//   "/updateWalkInStatus/:walkInId",
//   auth,
//   isInstructor,
//   updateWalkInStatus
// );

// // Schedule / update follow-up date
// router.put(
//   "/scheduleFollowUp/:walkInId",
//   auth,
//   isInstructor,
//   scheduleFollowUp
// );

// Convert walk-in to registered user
router.post(
  "/convertWalkInToUser/:walkInId",
  auth,
  isInstructor,
  convertWalkInToUser
);


// Get all walk-ins (with optional filters)
router.get(
  "/getAllWalkIns",
  auth,
  isInstructor,
  getAllWalkIns
);



//installments
router.post("/add-installment", auth, addInstallment);


module.exports = router;
