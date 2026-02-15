const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    course:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"courses"
        }
    ]
     
},
{timestamps : true});

module.exports = mongoose.model("category" , categorySchema);




// const mongoose = require("mongoose");

// const courseProgressSchema = new mongoose.Schema(
//   {
//     courseId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "courses", 
//       required: true,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "user",
//     },
//     completedVideos: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "subSection",
//       },
//     ],
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model( "courseprogress" , courseProgressSchema);
