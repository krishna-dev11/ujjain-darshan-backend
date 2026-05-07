const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({

    sectionName:{
        type:String
    },
    subSections:[{
        type : mongoose.Schema.Types.ObjectId,
        // required:true,
        ref:"subSection"
    }]

},
{timestamps : true});

module.exports = mongoose.model("section" , sectionSchema);