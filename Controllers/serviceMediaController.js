const Service = require("../Models/service");
const ServiceSection = require("../Models/serviceSection");
const ServiceMedia = require("../Models/serviceMedia");
const {
  uploadImageToCloudinary,
  deleteVideoTOCloudinary,
  updateVideoTOCloudinary,
} = require("../Utilities/uploadImageToCloudinary");

// checked
exports.createServiceMedia = async (req, res) => {
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
    let createdServiceMedia;
    try {
      createdServiceMedia = await ServiceMedia.create({
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
      updatedSection = await ServiceSection
        .findByIdAndUpdate(
          { _id: sectionId },
          { $push: { subSections: createdServiceMedia._id } },
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
      updatedCourse = await Service.findById({ _id: CourseId }).populate({
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


exports.updateServiceMedia = async (req, res) => {
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

      const updatedServiceMedia = await ServiceMedia.findById({_id:SubSectionId});
      // console.log(updatedServiceMedia , "Nikk")
      updatedServiceMedia.title = subSectionName;
      updatedServiceMedia.description = description;

      const uploadDetails = await uploadImageToCloudinary(
        lectureVideo,
        process.env.CLOUDINARY_FOLDER
      );
      // console.log(uploadDetails , "me pagal hu")

      updatedServiceMedia.videoUrl = uploadDetails.secure_url;
      updatedServiceMedia.timeDuration = `${uploadDetails.duration}`;

      await updatedServiceMedia.save();



    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Updation of SubSection Failed",
        error: error.message,
      });
    }

    let updatedCourse;
    try {
      updatedCourse = await Service.findById({ _id: CourseId }).populate({
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


exports.deleteServiceMedia = async (req, res) => {
  try {
    const { subSectionId, sectionId , courseId} = req.body;

    const deletedServiceMedia = await ServiceMedia.findByIdAndDelete({
      _id: subSectionId,
    });

    await ServiceSection.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSections: subSectionId,
        },
      }
    );

    if (!deletedServiceMedia) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" });
    }

    let updatedCourse;
    try {
      updatedCourse = await Service.findById({ _id: courseId }).populate({
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
