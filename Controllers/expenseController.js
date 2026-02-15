const mongoose = require("mongoose");
const Expense = require("../Models/expenseSchema");
const User = require("../Models/user");


/**
 * @desc Add a new coaching expense
 * @route POST /api/v1/expense/addExpense
 * @access Instructor / Admin
 */
exports.addExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      amount,
      category,        // e.g. "Electricity", "Furniture", "Maintenance", "Food", etc.
      description,
      expenseDate,      // optional (YYYY-MM-DD) — if not given, today will be used
      billNumber        // optional, but recommended
    } = req.body;

    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!amount || !category) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "amount and category are required",
      });
    }

    if (amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "amount must be greater than 0",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId).session(session);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can add expenses",
      });
    }

    // ---------- DATE HANDLING ----------
    const date = expenseDate ? new Date(expenseDate) : new Date();

    const year = date.getFullYear();
    const month = date.toLocaleString("default", { month: "long" }); // e.g. "February"
    const week = `Week-${Math.ceil(date.getDate() / 7)}`; // Approx week in month
    const day = date.getDate();

    // ---------- DUPLICATE CHECK (same bill, same day) ----------
    if (billNumber) {
      const existing = await Expense.findOne({
        billNumber,
        expenseDate: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        },
      }).session(session);

      if (existing) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Expense with this bill number already exists for today",
        });
      }
    }

    // ---------- CREATE EXPENSE ----------
    const expense = await Expense.create(
      [
        {
          amount,
          category,
          description: description || "",
          expenseDate: date,
          year,
          month,
          week,
          day,
          billNumber: billNumber || null,
          addedBy: staff._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Expense added successfully",
      data: expense[0],
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in addExpense:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add expense",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};









/**
 * @desc Get all expenses of a particular month with summary
 * @route GET /api/v1/expense/getExpenseByMonth
 * @access Instructor / Admin
 */
exports.getExpenseByMonth = async (req, res) => {
  try {
    const { year, month } = req.query; // e.g. year=2026 & month=February
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Both year and month are required (e.g. ?year=2026&month=February)",
      });
    }

    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year must be a valid number",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can view expenses",
      });
    }

    // ---------- FETCH EXPENSES ----------
    const expenses = await Expense.find({ year: Number(year), month })
      .sort({ expenseDate: -1 })
      .populate("addedBy", "firstName lastName email");

    // If no expenses found
    if (!expenses || expenses.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No expenses found for ${month} ${year}`,
        data: {
          totalExpense: 0,
          categoryBreakdown: {},
          expenses: [],
        },
      });
    }

    // ---------- CALCULATE TOTAL ----------
    const totalExpense = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // ---------- CATEGORY-WISE BREAKDOWN ----------
    const categoryBreakdown = {};

    expenses.forEach((exp) => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0;
      }
      categoryBreakdown[exp.category] += exp.amount;
    });

    return res.status(200).json({
      success: true,
      message: `Expenses fetched successfully for ${month} ${year}`,
      data: {
        year,
        month,
        totalExpense,
        categoryBreakdown,
        totalEntries: expenses.length,
        expenses,
      },
    });
  } catch (error) {
    console.error("Error in getExpenseByMonth:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly expenses",
      error: error.message,
    });
  }
};





/**
 * @desc Get all expenses of a particular week
 * @route GET /api/v1/expense/getExpenseByWeek
 * @access Instructor / Admin
 */
exports.getExpenseByWeek = async (req, res) => {
  try {
    const { year, month, week } = req.query; 
    // example: ?year=2026&month=February&week=Week-2

    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!year || !month || !week) {
      return res.status(400).json({
        success: false,
        message:
          "year, month and week are required (e.g. ?year=2026&month=February&week=Week-2)",
      });
    }

    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year must be a valid number",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can view expenses",
      });
    }

    // ---------- FETCH EXPENSES ----------
    const expenses = await Expense.find({
      year: Number(year),
      month: month,
      week: week,
    })
      .sort({ expenseDate: -1 })
      .populate("addedBy", "firstName lastName email");

    // If no expenses found
    if (!expenses || expenses.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No expenses found for ${week}, ${month} ${year}`,
        data: {
          totalExpense: 0,
          categoryBreakdown: {},
          expenses: [],
        },
      });
    }

    // ---------- CALCULATE TOTAL ----------
    const totalExpense = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // ---------- CATEGORY-WISE BREAKDOWN ----------
    const categoryBreakdown = {};

    expenses.forEach((exp) => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0;
      }
      categoryBreakdown[exp.category] += exp.amount;
    });

    return res.status(200).json({
      success: true,
      message: `Expenses fetched successfully for ${week}, ${month} ${year}`,
      data: {
        year,
        month,
        week,
        totalExpense,
        categoryBreakdown,
        totalEntries: expenses.length,
        expenses,
      },
    });
  } catch (error) {
    console.error("Error in getExpenseByWeek:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch weekly expenses",
      error: error.message,
    });
  }
};






/**
 * @desc Get all expenses of a particular day
 * @route GET /api/v1/expense/getExpenseByDay
 * @access Instructor / Admin
 */
exports.getExpenseByDay = async (req, res) => {
  try {
    const { year, month, day } = req.query;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!year || !month || !day) {
      return res.status(400).json({
        success: false,
        message:
          "year, month and day are required (e.g. ?year=2026&month=February&day=8)",
      });
    }

    if (isNaN(year) || isNaN(day)) {
      return res.status(400).json({
        success: false,
        message: "Year and day must be valid numbers",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can view expenses",
      });
    }

    // ---------- FETCH EXPENSES ----------
    const expenses = await Expense.find({
      year: Number(year),
      month: month,
      day: Number(day),
    })
      .sort({ expenseDate: -1 })
      .populate("addedBy", "firstName lastName email");

    // If no expenses found
    if (!expenses || expenses.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No expenses found for ${day} ${month} ${year}`,
        data: {
          totalExpense: 0,
          categoryBreakdown: {},
          expenses: [],
        },
      });
    }

    // ---------- CALCULATE TOTAL ----------
    const totalExpense = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // ---------- CATEGORY-WISE BREAKDOWN ----------
    const categoryBreakdown = {};

    expenses.forEach((exp) => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0;
      }
      categoryBreakdown[exp.category] += exp.amount;
    });

    return res.status(200).json({
      success: true,
      message: `Expenses fetched successfully for ${day} ${month} ${year}`,
      data: {
        year,
        month,
        day: Number(day),
        totalExpense,
        categoryBreakdown,
        totalEntries: expenses.length,
        expenses,
      },
    });
  } catch (error) {
    console.error("Error in getExpenseByDay:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily expenses",
      error: error.message,
    });
  }
};







/**
 * @desc Delete an expense entry
 * @route DELETE /api/v1/expense/deleteExpense
 * @access Instructor / Admin
 */
exports.deleteExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { expenseId } = req.body;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!expenseId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "expenseId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid expenseId format",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId).session(session);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can delete expenses",
      });
    }

    // ---------- CHECK EXPENSE EXISTS ----------
    const expense = await Expense.findById(expenseId).session(session);
    if (!expense) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // ---------- DELETE EXPENSE ----------
    await Expense.findByIdAndDelete(expenseId).session(session);

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: {
        deletedExpenseId: expenseId,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in deleteExpense:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete expense",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};






/**
 * @desc Update an existing expense
 * @route PUT /api/v1/expense/updateCurrentExpense
 * @access Instructor / Admin
 */
exports.updateCurrentExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      expenseId,
      amount,
      category,
      description,
      expenseDate,
      billNumber,
    } = req.body;

    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!expenseId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "expenseId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid expenseId format",
      });
    }

    if (amount && amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "amount must be greater than 0",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId).session(session);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can update expenses",
      });
    }

    // ---------- CHECK EXPENSE EXISTS ----------
    const expense = await Expense.findById(expenseId).session(session);
    if (!expense) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // ---------- HANDLE DATE CHANGE (if provided) ----------
    let updateFields = {};

    if (expenseDate) {
      const date = new Date(expenseDate);

      const year = date.getFullYear();
      const month = date.toLocaleString("default", { month: "long" });
      const week = `Week-${Math.ceil(date.getDate() / 7)}`;
      const day = date.getDate();

      updateFields = {
        ...updateFields,
        expenseDate: date,
        year,
        month,
        week,
        day,
      };
    }

    // ---------- BUILD UPDATE OBJECT ----------
    if (amount) updateFields.amount = amount;
    if (category) updateFields.category = category;
    if (description !== undefined) updateFields.description = description;
    if (billNumber !== undefined) updateFields.billNumber = billNumber;

    // ---------- DUPLICATE BILL CHECK (if bill changed) ----------
    if (billNumber && billNumber !== expense.billNumber) {
      const date = expenseDate ? new Date(expenseDate) : new Date(expense.expenseDate);

      const existing = await Expense.findOne({
        _id: { $ne: expenseId },
        billNumber,
        expenseDate: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        },
      }).session(session);

      if (existing) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Another expense with this bill number already exists for this day",
        });
      }
    }

    // ---------- UPDATE EXPENSE ----------
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      { $set: updateFields },
      { new: true, session }
    ).populate("addedBy", "firstName lastName email");

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in updateCurrentExpense:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};






/**
 * @desc Get all expenses of a particular year with month & category summary
 * @route GET /api/v1/expense/fetchAllExpenseListOfTheYear
 * @access Instructor / Admin
 */
exports.fetchAllExpenseListOfTheYear = async (req, res) => {
  try {
    const { year } = req.query;
    const staffId = req.user.id;

    // ---------- VALIDATION ----------
    if (!year) {
      return res.status(400).json({
        success: false,
        message: "year is required (e.g. ?year=2026)",
      });
    }

    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year must be a valid number",
      });
    }

    // ---------- ROLE CHECK ----------
    const staff = await User.findById(staffId);
    if (!staff || !["Instructor", "Admin"].includes(staff.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Only Instructor or Admin can view yearly expenses",
      });
    }

    // ---------- FETCH ALL EXPENSES OF THE YEAR ----------
    const expenses = await Expense.find({ year: Number(year) })
      .sort({ expenseDate: -1 })
      .populate("addedBy", "firstName lastName email");

    // If no data
    if (!expenses || expenses.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No expenses found for year ${year}`,
        data: {
          totalYearlyExpense: 0,
          monthWiseSummary: {},
          categoryWiseSummary: {},
          expenses: [],
        },
      });
    }

    // ---------- TOTAL YEARLY EXPENSE ----------
    const totalYearlyExpense = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // ---------- MONTH-WISE SUMMARY ----------
    const monthWiseSummary = {};

    expenses.forEach((exp) => {
      if (!monthWiseSummary[exp.month]) {
        monthWiseSummary[exp.month] = 0;
      }
      monthWiseSummary[exp.month] += exp.amount;
    });

    // ---------- CATEGORY-WISE SUMMARY ----------
    const categoryWiseSummary = {};

    expenses.forEach((exp) => {
      if (!categoryWiseSummary[exp.category]) {
        categoryWiseSummary[exp.category] = 0;
      }
      categoryWiseSummary[exp.category] += exp.amount;
    });

    return res.status(200).json({
      success: true,
      message: `All expenses fetched successfully for year ${year}`,
      data: {
        year: Number(year),
        totalYearlyExpense,
        monthWiseSummary,
        categoryWiseSummary,
        totalEntries: expenses.length,
        expenses,
      },
    });
  } catch (error) {
    console.error("Error in fetchAllExpenseListOfTheYear:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch yearly expenses",
      error: error.message,
    });
  }
};
