const Course = require("../Models/courses");
const Category = require("../Models/category");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.aiChat = async (req, res) => {
  try {
    const { query } = req.body;

    console.log("Received Query:", query);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    // Step 1: Find matching category (if any)
    const category = await Category.findOne({
      name: { $regex: query, $options: "i" },
    });

    let courses;

    if (category) {
      courses = await Course.find({ category: category._id })
        .populate("ratingAndReviews")
        .populate("studentEnrolled");
    } else {
      courses = await Course.find({})
        .populate("ratingAndReviews")
        .populate("studentEnrolled");
    }

    // Step 2: Prepare structured course data for AI
    const courseDataForAI = courses.map((course) => {
      const avgRating =
        course.ratingAndReviews.length > 0
          ? course.ratingAndReviews.reduce(
              (sum, r) => sum + r.rating,
              0
            ) / course.ratingAndReviews.length
          : 0;

      return {
        courseName: course.courseName,
        category: category?.name || "Mixed",
        price: course.price,
        studentsEnrolled: course.studentEnrolled.length,
        avgRating: avgRating.toFixed(2),
        tags: course.tag,
      };
    });

    // Step 3: Create AI Prompt
    const prompt = `
    You are an AI Study Assistant for an EdTech platform.

    User Query: "${query}"

    Available Courses Data (JSON):
    ${JSON.stringify(courseDataForAI, null, 2)}

    Your task:
    - Recommend the best 2-3 courses based on:
      - Highest ratings
      - Most students enrolled
      - Relevance to user's query
    - Explain in simple Hinglish.
    - Use only the given course data.
    `;

    // Step 4: Call Gemini AI (CORRECT MODEL)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    res.status(200).json({
      success: true,
      aiAnswer: aiResponse,
      coursesConsidered: courseDataForAI,
    });

  } catch (error) {
    console.error("AI Error:", error.message);

    res.status(500).json({
      success: false,
      message: "AI processing failed",
      error: error.message,
    });
  }
};
