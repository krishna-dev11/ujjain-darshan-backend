const courses = require("../Models/courses");
const section = require("../Models/section");
// const user = require("../Models/user");

// checked
exports.createSection = async(req , res)=>{
    try{

        const{sectionName , courseId} = req.body;

        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message : "plaease enter section name carefully"
            })
        }

        const newsection = await section.create({sectionName : sectionName})
        // console.log(newsection)
        const updateCourse = await courses.findByIdAndUpdate(
            { _id: courseId },
            { $push: { courseContent: newsection._id } },
            { new: true }
        ).populate({
            path: "courseContent",
            populate: { path: "subSections" }
        });
        
// console.log("hi")
        return res.status(200).json({
            success:true,
            message:"section created successfully",
            data : updateCourse
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"some error occurs on creating the section"
        })
    }
}

// checked
exports.updateSection = async(req , res)=>{
    try{
        // console.log(req.body , "flyjaattt")
        const {sectionName , sectionId , CourseId} = req.body;

        if(!sectionName || !sectionId || !CourseId){
            return res.status(400).json({
                success:false,
                message:"Please enter a section name carefully"
            })
        }

        // Update the section name
        const updatedSection = await section.findByIdAndUpdate(
            {_id : sectionId},
            { sectionName: sectionName },
            { new: true }
        );

        if(!updatedSection){
            return res.status(400).json({
                success:false,
                message:"Section not found"
            });
        }

        // Update the course if needed, but avoid pushing duplicate IDs
        const updatedCourse = await courses.findOneAndUpdate(
            { _id: CourseId, courseContent: sectionId }, // Check if sectionId already exists in courseContent
            { $set: { "courseContent.$": updatedSection._id } }, // Update only if it exists
            { new: true }
        ).populate({
            path: "courseContent",
            populate: { path: "subSections" }
        });

        if(!updatedCourse){
            return res.status(400).json({
                success:false,
                message:"Section with this section ID is not present in course schema",
            });
        }

        return res.status(200).json({
            success:true,
            message:"Section updated successfully",
            data:updatedCourse
        });

    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"Some error occurred while updating the section"
        });
    }
}


// checked but some error
exports.deleteSection = async (req, res) => {
    try {
        // Extracting sectionId and courseId from request body
        const { sectionId , courseId } = req.body;
        // console.log(sectionId, courseId , "fucky")

        // Deleting the section from the 'section' collection
        const deletedSection = await section.findByIdAndDelete(sectionId);

        // Checking if the section exists
        if (!deletedSection) {
            return res.status(400).json({
                success: false,
                message: "Section with this sectionId is not present in the section schema",
            });
        }

        // Removing the section reference from the 'courses' collection
        const deletesectionEnteryFromCourse = await courses.findByIdAndUpdate(
            courseId,
            {
                $pull: {
                    courseContent: sectionId  // Use sectionId directly if it's stored as an ID in the array
                }
            },
            { new: true }
        ).populate({
            path: "courseContent",
            populate: { path: "subSections" }
        });

        // Return the success response
        return res.status(200).json({
            success: true,
            message: "Section deleted successfully",
            data: deletesectionEnteryFromCourse
        });

    } catch (error) {
        // Return the error response
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Some error occurred while deleting the section"
        });
    }
};


