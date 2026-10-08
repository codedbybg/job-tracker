const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title : {
            type : String,
            required : true,
            trim : true,
            max_length : 100
        },
        company : {
            type : String,
            required : true,
            trim : true,
            max_length : 100
        },
        description : {
            type : String,
            required : true,
            trim : true
        },
        location : {
            type : String,
            required : true,
            trim : true
        },
        jobType : {
            type : String,
            enum : [
                "full-time",
                "part-time",
                "internship",
                "contract"
            ],
            required : true
        },
        salaryMin : {
            type : Number,
            min : 0
        },
        salaryMax : {
            type : Number,
            min : 0
        },
        experienceMin : {
            type : Number,
            min : 0,
            default : 0
        },
        skills : {
            type : [String],
            default : []
        },
        deadline : {
            type : Date,
            required : true
        },
        status : {
            type : String,
            enum : ["open" , "closed"],
            default : "open"
        },
        recruiter : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
            required : true
        },
        applicantsCount : {
            type : Number,
            default : 0
        }
    },
    {
        timestamps : true
    }
);

const Job = mongoose.model("Job" , jobSchema);

module.exports = Job;