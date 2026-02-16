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
    // const prompt = `
    // You are an AI Study Assistant for an EdTech platform.

    // User Query: "${query}"

    // Available Courses Data (JSON):
    // ${JSON.stringify(courseDataForAI, null, 2)}

    // Your task:
    // - Recommend the best 2-3 courses based on:
    //   - Highest ratings
    //   - Most students enrolled
    //   - Relevance to user's query
    // - Explain in simple Hinglish.
    // - Use only the given course data.
    // `;




    // Step 3: CUSTOMIZED SPIRITUAL PROMPT
    const prompt = `
    You are 'Shree Ji AI Assistant', a respectful and knowledgeable spiritual guide for 'Shree Ji Divine Yatra & Darshan' in Ujjain. 
    Your owner/founder is Dhruv Vasanwal.

    User Query: "${query}"

    Available Divine Services Data (JSON):
    ${JSON.stringify(courseDataForAI, null, 2)}

    Your task:
    1. Greeting: Always start with "Jai Mahakal! 🙏" or "Radhe Radhe!".
    2. Persona: Act as a helpful guide for devotees (bhakts).
    3. Recommendations: Suggest the best 2-3 Divine Services (Darshan, Puja, or Yatra packages) based on the query.
    4. Trust: Use 'devoteesServed' to show reliability (e.g., "Ab tak 2000+ bhakto ne is seva ka labh liya hai").
    5. Language: Speak in polite and warm Hinglish. Use words like 'Dakshina' instead of 'Price'.
    6. Guardrail: If no relevant service is found in the data, ask them to contact Dhruv Vasanwal directly at 9630385826.
    7. Use ONLY the provided database to answer.
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




// const Course = require("../Models/courses");
// const Category = require("../Models/category");
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// exports.aiChat = async (req, res) => {
//   try {
//     const { query } = req.body;

//     if (!query) {
//       return res.status(400).json({
//         success: false,
//         message: "Query is required",
//       });
//     }

//     // Step 1: Category matching (Ujjain Darshan, Puja, etc.)
//     const category = await Category.findOne({
//       name: { $regex: query, $options: "i" },
//     });

//     let services; // Use services variable name for clarity in code

//     if (category) {
//       services = await Course.find({ category: category._id })
//         .populate("ratingAndReviews")
//         .populate("studentEnrolled");
//     } else {
//       services = await Course.find({})
//         .populate("ratingAndReviews")
//         .populate("studentEnrolled");
//     }

//     // Step 2: Prepare structured service data (Mapping Course schema to Service logic)
//     const serviceDataForAI = services.map((service) => {
//       const avgRating =
//         service.ratingAndReviews.length > 0
//           ? service.ratingAndReviews.reduce(
//               (sum, r) => sum + r.rating,
//               0
//             ) / service.ratingAndReviews.length
//           : 0;

//       return {
//         serviceName: service.courseName, // Mapping Name
//         category: category?.name || "Divine Services",
//         price: service.price,
//         pilgrimsServed: service.studentEnrolled.length, // Mapping Enrolled to Pilgrims
//         avgRating: avgRating.toFixed(2),
//         description: service.courseDescription,
//         tags: service.tag,
//       };
//     });

//     // Step 3: Updated AI Prompt for Spiritual Context
//     const prompt = `
//     You are 'Shree Ji AI Assistant', a spiritual guide for 'Shree Ji Divine Yatra & Darshan' in Ujjain. 
//     Your owner is Dhruv Vasanwal.

//     User Query: "${query}"

//     Available Services Data (from our database):
//     ${JSON.stringify(serviceDataForAI, null, 2)}

//     Your task:
//     1. Act as a polite spiritual assistant.
//     2. Recommend the best 2-3 Divine Services (Darshan, Puja, or Yatra packages) based on the user's query.
//     3. If the data says "courseName", refer to it as "Darshan Package" or "Service Name".
//     4. If the data says "pilgrimsServed", use it to show trust (e.g., "2000+ bhakto ne ye service li hai").
//     5. Speak in respectful and friendly Hinglish (e.g., "Jai Mahakal! Aapke liye humare paas ye best Darshan packages hain...").
//     6. Always mention that Shree Ji Divine Yatra provides a seamless and peaceful experience.
//     7. Use only the provided data to answer.
//     `;

//     // Step 4: Call Gemini AI
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Note: Corrected model name to stable version
//     const result = await model.generateContent(prompt);
//     const aiResponse = result.response.text();

//     res.status(200).json({
//       success: true,
//       aiAnswer: aiResponse,
//       servicesConsidered: serviceDataForAI,
//     });

//   } catch (error) {
//     console.error("AI Error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "AI processing failed",
//       error: error.message,
//     });
//   }
// };