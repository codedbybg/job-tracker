const Job = require("../models/Job");
const User = require("../models/User");

// CREATE JOB
const createJob = async (req , res)=>{
    try {
        const {
            title , 
            company,
            description,
            location,
            jobType,
            salaryMin,
            salaryMax,
            experienceMin,
            skills,
            deadline
        } = req.body;


        // 1. Check Validation
        if(
            !title || !company ||
            !description || !location ||
            !jobType || !deadline
        ){
            return res.status(400).json({
                success : false,
                message : "Required job fields are missing",
            });
        }

        if(
            salaryMin !== undefined &&
            salaryMax !== undefined &&
            salaryMin > salaryMax
        ){
            res.status(400).json({
                success : false,
                message : "Minimum salary cannot be greater than Maximum salary"
            });
        }

        // 2. CREATING JOB

        const job = await Job.create({
            title,
            company,
            description,
            location,
            jobType,
            salaryMin,
            salaryMax,
            experienceMin,
            skills,
            deadline,
            recruiter: req.user.id
        });

        res.status(201).json({
            success : true,
            message : "Job created successfully",
            data : job
        });

    } catch (error) {
        console.error(error);


        res.status(500).json({
            success : false,
            message : "Failed to create job",
            error : error.message
        });
    }
};

// GET ALL JOBS
const getJobs = async (req , res)=>{
    try {
        const jobs = await Job.find({
            status : "open"
        }).populate("recruiter" , "name email").sort({createdAt : -1});

        res.status(200).json({
            success : true,
            count : jobs.length,
            data : jobs
        });


    } catch (error) {
        console.error(error);

        res.status(500).json({
            success : false,
            message : "Failed to fetch jobs",
            error : error.message
        });
    }
};

// GET SINGLE JOB
const getJobById = async (req , res)=>{
    try {
        const {id} = req.params;

        const job = await Job.findById(id).populate("recruiter" , "name email");

        if(!job){
            return res.status(404).json({
                success : false,
                message : "Job not found"
            });
        }

        res.status(200).json({
            success : true,
            data : job
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success : false,
            message : "Failed to fetch job",
            error : error.message
        });
    }
};

// UPDATE JOB
const updateJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const isOwner =
            job.recruiter.toString() === req.user.id;

        const isAdmin =
            req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own jobs"
            });
        }

        const updatedJob = await Job.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: "Job updated successfully",
            data: updatedJob
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update job",
            error: error.message
        });
    }
};

// DELETE JOB
const deleteJob = async (req , res)=>{
    try {
        const {id} = req.params;

        const job = await Job.findById(id);

        if(!job){
            return res.status(404).json({
                success : false,
                message : "Job not found"
            });
        }

        const isOwner = job.recruiter.toString()  === req.user.id;

        const isAdmin = req.user.role === "admin";

        if(!isOwner && !isAdmin){
            return res.status(403).json({
                success : false,
                message : "You can only delete your own jobs"
            });
        }

        await Job.findByIdAndDelete(id);

        res.status(200).json({
            success : true,
            message : " Job Deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success : false,
            message : "Failed to delete job",
            error : error.error
        });
    }
};



module.exports = {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    deleteJob
};