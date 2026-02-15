const express = require("express");
const router = express.Router();


const { addInstallment } = require("../Controllers/installmentController");
const { auth } = require("../Middlewares/auth");

// ===============================
// INSTALLMENT ROUTES
// ===============================

// ➕ Add new installment
router.post(
  "/add-installment",
  auth,                 // Only logged-in Instructor/Admin
  addInstallment
);

module.exports = router;
