const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        job : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Job",
            required : true
        },
        candidate : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
            required: true
        },
        coverLetter : {
            type : String,
            trim : true,
            max_length : 2000,
            default : ""
        },
        status : {
            type : String,
            enum : [
                "applied",
                "shortlisted",
                "interview",
                "selected",
                "rejected",
                "withdrawn"
            ],
            default : "applied"
        },
        appliedAt : {
            type : Date,
            default : Date.now
        }
    },
    {
        timestamps : true
    }
);

// One candidate can apply to a particular job only once
applicationSchema.index(
    {job : 1  , candidate : 1 },
    { unique : true }
);

const Application = mongoose.model("Application" , applicationSchema);

module.exports = Application;