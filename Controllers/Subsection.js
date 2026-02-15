const courses = require("../Models/courses");
const section = require("../Models/section");
const subsection = require("../Models/subsection");
const {
  uploadImageToCloudinary,
  deleteVideoTOCloudinary,
  updateVideoTOCloudinary,
} = require("../Utilities/uploadImageToCloudinary");

// checked
exports.createSubSection = async (req, res) => {
  try {
    const { subSectionName, description, sectionId, timeDuration, CourseId } =
      req.body;

    // Check if lecture video is provided
    if (!req.files || !req.files.lectureVideo) {
      return res.status(400).json({
        success: false,
        message: "Lecture video is required.",
      });
    }

    const lectureVideo = req.files.lectureVideo;

    // Validate all required fields
    if (
      !subSectionName ||
      !description ||
      !timeDuration ||
      !CourseId ||
      !sectionId
    ) {
      return res.status(404).json({
        success: false,
        message: "Please provide all details carefully and completely",
      });
    }

    // Upload video to Cloudinary
    let uploadCloudinary;
    try {
      uploadCloudinary = await uploadImageToCloudinary(
        lectureVideo,
        process.env.CLOUDINARY_FOLDER
      );
      // console.log(uploadCloudinary , "meeeeeeeeeeeeeeeeeee")
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload video to Cloudinary",
        error: error.message,
      });
    }

    // Create Subsection
    let createSubsection;
    try {
      createSubsection = await subsection.create({
        title: subSectionName,
        timeDuration: uploadCloudinary.duration,
        description: description,
        videoUrl: uploadCloudinary.secure_url,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create subsection",
        error: error.message,
      });
    }

    // Update Section
    let updatedSection;
    try {
      updatedSection = await section
        .findByIdAndUpdate(
          { _id: sectionId },
          { $push: { subSections: createSubsection._id } },
          { new: true }
        )
        .populate("subSections")
        .exec();

      if (!updatedSection) {
        return res.status(400).json({
          success: false,
          message: "Section not found with the provided sectionId",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update section",
        error: error.message,
      });
    }

    // Update Course
    let updatedCourse;
    try {
      updatedCourse = await courses.findById({ _id: CourseId }).populate({
        path: "courseContent",
        populate: { path: "subSections" },
      });

      if (!updatedCourse) {
        return res.status(400).json({
          success: false,
          message: "Course not found with the provided CourseId",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update course",
        error: error.message,
      });
    }

    // Success Response
    return res.status(200).json({
      success: true,
      message: "Subsection created successfully",
      data: updatedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occurred while creating the subsection",
      error: error.message,
    });
  }
};


exports.updateSubSection = async (req, res) => {
  try {
    const {
      SubSectionId,
      CourseId,
      subSectionName,
      timeDuration,
      description,
    } = req.body;

    // console.log(req.body , req.files.lectureVideo , "sunny")

    const lectureVideo = req.files.lectureVideo;

    if (
      !SubSectionId ||
      !subSectionName ||
      !timeDuration ||
      !description ||
      !CourseId
    ) {
      return res.status(400).json({
        success: false,
        message: "Please Provide all details",
      });
    }

    if (!lectureVideo) {
      return res.status(400).json({
        success: false,
        message: "Lecture video is required.",
      });
    }

    try {

      const UpdatesubSection = await subsection.findById({_id:SubSectionId});
      // console.log(UpdatesubSection , "Nikk")
      UpdatesubSection.title = subSectionName;
      UpdatesubSection.description = description;

      const uploadDetails = await uploadImageToCloudinary(
        lectureVideo,
        process.env.CLOUDINARY_FOLDER
      );
      // console.log(uploadDetails , "me pagal hu")

      UpdatesubSection.videoUrl = uploadDetails.secure_url;
      UpdatesubSection.timeDuration = `${uploadDetails.duration}`;

      await UpdatesubSection.save();



    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Updation of SubSection Failed",
        error: error.message,
      });
    }

    let updatedCourse;
    try {
      updatedCourse = await courses.findById({ _id: CourseId }).populate({
        path: "courseContent",
        populate: { path: "subSections" },
      });

      if (!updatedCourse) {
        return res.status(400).json({
          success: false,
          message: "Course not found with the provided CourseId",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update course",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subsection Updated successfully",
      data: updatedCourse,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the section",
      error:error.message
    });
  }
};
// checked


exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId , courseId} = req.body;

    const subSection = await subsection.findByIdAndDelete({
      _id: subSectionId,
    });

    await section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSections: subSectionId,
        },
      }
    );

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" });
    }

    let updatedCourse;
    try {
      updatedCourse = await courses.findById({ _id: courseId }).populate({
        path: "courseContent",
        populate: { path: "subSections" },
      });

      if (!updatedCourse) {
        return res.status(400).json({
          success: false,
          message: "Course not found with the provided CourseId",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update course",
        error: error.message,
      });
    }


    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data:updatedCourse
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    });
  }
};
// checked
