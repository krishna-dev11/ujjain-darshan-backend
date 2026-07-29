const ContactAction = require("../Models/contactAction");

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
