const express = require("express");
const router = express.Router();
const {
  trackContactAction,
  getContactActionStats,
  getContactActionLogs,
} = require("../Controllers/contactActionController");
const { auth } = require("../Middlewares/auth");

router.post("/track", trackContactAction);
router.get("/stats", getContactActionStats);
router.get("/logs", auth, getContactActionLogs);

module.exports = router;
