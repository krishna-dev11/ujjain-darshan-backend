const express = require("express");
const router = express.Router();

// Controllers
const {
  addExpense,
  getExpenseByMonth,
  getExpenseByWeek,
  getExpenseByDay,
  deleteExpense,
  updateCurrentExpense,
  fetchAllExpenseListOfTheYear
} = require("../Controllers/expenseController");

// Middleware
const { auth, isInstructor, isAdmin } = require("../Middlewares/auth");

// ======================
// COACHING EXPENSE ROUTES
// ======================

// ➕ Add new expense
router.post(
  "/addExpense",
  auth,
  isInstructor,
  addExpense
);

// 📅 Get expenses of a particular MONTH
router.get(
  "/getExpenseByMonth",
  auth,
  isInstructor,
  getExpenseByMonth
);

// 🗓 Get expenses of a particular WEEK
router.get(
  "/getExpenseByWeek",
  auth,
  isInstructor,
  getExpenseByWeek
);

// 📆 Get expenses of a particular DAY
router.get(
  "/getExpenseByDay",
  auth,
  isInstructor,
  getExpenseByDay
);

// 🗑 Delete an expense
router.delete(
  "/deleteExpense",
  auth,
  isInstructor,
  deleteExpense
);

// ✏️ Update an existing expense
router.put(
  "/updateCurrentExpense",
  auth,
  isInstructor,
  updateCurrentExpense
);

// 📊 Get ALL expenses of a YEAR (summary + list)
router.get(
  "/fetchAllExpenseListOfTheYear",
  auth,
  isInstructor,
  fetchAllExpenseListOfTheYear
);

module.exports = router;
