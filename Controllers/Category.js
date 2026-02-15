// const { COURSE_STATUS } = require("../../src/Utilities/Constaints");
const category = require("../Models/category");
require("dotenv").config();

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Checked
exports.creatcategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "fill add details completely and carefully",
      });
    }

    // extra mene lagaya hai
    const categoryAlreadyExist = await category.findOne({ name: name });

    if (categoryAlreadyExist) {
      return res.status(400).json({
        success: false,
        message: "you already created the similar category previously",
      });
    }
    //

    const createNewCategory = await category.create({
      name: name,
      description: description,
    });

    return res.status(200).json({
      success: true,
      message: "Category created successfully in database",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "there would be some error on creating a new category in database",
    });
  }
};

// checked
exports.getAllCategory = async (req, res) => {
  try {
    const allCategory = await category.find(
      {},
      { name: true, description: true }
    );

    if (!allCategory) {
      return res.status(400).json({
        success: false,
        message:
          "data base can't contain any of the Category so create some categories to published ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "all category fetched successfully",
      data: allCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "some error occurs in fetching the all Category data from the database",
    });
  }
};

//checked
exports.categoryPageDetails = async (req, res) => {
  try {
    // console.log(req.body  , "nikkkkkk")
    //get categoryId
    const { categoryId } = req.body;
    //get courses for specified categoryId
    const selectedCategory = await category
    .findById({ _id: categoryId })
    .populate({
      path: "course",
      match: { status: "Published" },
      populate: [
        {
          path: "instructor",
        },
        // {
        //   path: "ratingAndReviews", 
        // },
      ],
    })
    .exec();
  

    //validation
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Data  Not Found Along With These CategoryId",
      });
    }

    //get courses for different categories

    const categoriesExceptSelected = await category.find({
      _id: { $ne: categoryId },
    });

    let RandomCategory
    if (categoriesExceptSelected.length > 0) {
      const randomIndex = getRandomInt(categoriesExceptSelected.length);
      const randomCategoryId = categoriesExceptSelected[randomIndex]._id;

       RandomCategory = await category
        .findOne({ _id: randomCategoryId })
        .populate({
          path: "course",
          match: { status: "Published" },
          populate: [
            {
              path: "instructor",
            },
            {
              path: "ratingAndReviews", 
            },
          ],
        })
        .exec();
    } else {
      console.log("No other categories available.");
    }

    //get top 10 selling courses
    //HW - write it on your own
    const AllCategories = await category
      .find()
      .populate({
        path: "course",
        match: { status: "Published" },
        populate: [
          {
            path: "instructor",
          },
          {
            path: "ratingAndReviews", 
          },
        ],
      })
      .exec();

    const CombinedIntoSingleArray = AllCategories.flatMap(
      (category) => category.course
    );
    const TopSellingCourses = CombinedIntoSingleArray.sort(
      (a, b) => b.studentEnrolled.length - a.studentEnrolled.length
    ).slice(0, 10);

    //return response
    return res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        RandomCategory,
        TopSellingCourses,
      },
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
