const express = require("express");
const router = express.Router();
const {
  trackContactAction,
  getContactActionStats,
} = require("../Controllers/contactActionController");

router.post("/track", trackContactAction);
router.get("/stats", getContactActionStats);

module.exports = router;
