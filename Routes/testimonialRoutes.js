const express = require("express");
const router = express.Router();
const { auth } = require("../Middlewares/auth");
const {
  addTestimonial,
  getAllTestimonials,
  deleteTestimonial,
} = require("../Controllers/testimonialController");

router.post("/addTestimonial", auth, addTestimonial);
router.get("/getAllTestimonials", getAllTestimonials);
router.delete("/deleteTestimonial", auth, deleteTestimonial);

module.exports = router;
