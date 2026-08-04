const ContactAction = require("../Models/contactAction");
const ContactActionLog = require("../Models/contactActionLog");
const User = require("../Models/user");
const jwt = require("jsonwebtoken");

const getTokenFromRequest = (req) => {
  const authHeader = req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return req.body?.token || req.cookies?.token || null;
};

const getLoggedInUser = async (req) => {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    return await User.findById(payload.id).populate("additionalDetails").lean();
  } catch (error) {
    return null;
  }
};

exports.trackContactAction = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !["whatsapp", "call"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact action type.",
      });
    }

    const updated = await ContactAction.findOneAndUpdate(
      { type },
      { $inc: { count: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const loggedInUser = await getLoggedInUser(req);
    const profile = loggedInUser?.additionalDetails;

    await ContactActionLog.create({
      type,
      user: loggedInUser?._id || null,
      userName: loggedInUser
        ? `${loggedInUser.firstName || ""} ${loggedInUser.lastName || ""}`.trim()
        : "Guest User",
      email: loggedInUser?.email || "",
      contactNumber:
        profile?.contactNumber !== undefined && profile?.contactNumber !== null
          ? String(profile.contactNumber)
          : "",
      accountType: loggedInUser?.accountType || "",
      ipAddress: req.headers["x-forwarded-for"]?.split(",")?.[0] || req.socket?.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
    });

    return res.status(200).json({
      success: true,
      message: "Contact action tracked.",
      data: {
        type,
        count: updated.count,
      },
    });
  } catch (error) {
    console.error("trackContactAction error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track contact action.",
    });
  }
};

exports.getContactActionLogs = async (req, res) => {
  try {
    const { month, year, type } = req.query;
    const filter = {};

    if (["whatsapp", "call"].includes(type)) {
      filter.type = type;
    }

    if (month && year) {
      const monthNumber = Number(month);
      const yearNumber = Number(year);

      if (
        Number.isInteger(monthNumber) &&
        Number.isInteger(yearNumber) &&
        monthNumber >= 1 &&
        monthNumber <= 12
      ) {
        filter.createdAt = {
          $gte: new Date(yearNumber, monthNumber - 1, 1),
          $lt: new Date(yearNumber, monthNumber, 1),
        };
      }
    }

    const logs = await ContactActionLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    const summary = logs.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.type === "whatsapp") acc.whatsapp += 1;
        if (item.type === "call") acc.call += 1;
        return acc;
      },
      { total: 0, whatsapp: 0, call: 0 }
    );

    return res.status(200).json({
      success: true,
      data: logs,
      summary,
    });
  } catch (error) {
    console.error("getContactActionLogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact action logs.",
    });
  }
};

exports.getContactActionStats = async (req, res) => {
  try {
    const stats = await ContactAction.find({}).lean();

    const payload = {
      whatsapp: 0,
      call: 0,
    };

    stats.forEach((item) => {
      if (item.type === "whatsapp") payload.whatsapp = item.count || 0;
      if (item.type === "call") payload.call = item.count || 0;
    });

    return res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error("getContactActionStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact action stats.",
    });
  }
};
