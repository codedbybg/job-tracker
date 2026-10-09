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
// GET JOBS WITH SEARCH, FILTERING & PAGINATION
const getJobs = async (req, res) => {
    try {
        const {
            keyword,
            location,
            jobType,
            minSalary,
            maxSalary,
            skills,
            sort = "newest",
            page = 1,
            limit = 10
        } = req.query;

    if (minSalary && isNaN(Number(minSalary))) {
        return res.status(400).json({
            success: false,
            message: "minSalary must be a valid number"
        });
    }

    if (maxSalary && isNaN(Number(maxSalary))) {
        return res.status(400).json({
            success: false,
            message: "maxSalary must be a valid number"
        });
    }

        // -----------------------------
        // BUILD FILTER
        // -----------------------------

        const filter = {
            status: "open"
        };

        // Keyword search
        if (keyword) {
            filter.$or = [
                {
                    title: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    company: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: keyword,
                        $options: "i"
                    }
                }
            ];
        }

        // Location filter
        if (location) {
            filter.location = {
                $regex: location,
                $options: "i"
            };
        }

        // Job type filter
        if (jobType) {
            filter.jobType = jobType;
        }

        // Salary range filter
        if (minSalary || maxSalary) {
            filter.salaryMin = {};
            filter.salaryMax = {};

            if (minSalary) {
                filter.salaryMax.$gte = Number(minSalary);
            }

            if (maxSalary) {
                filter.salaryMin.$lte = Number(maxSalary);
            }
        }

        // Skills filter
        if (skills) {
            const skillArray = skills
                .split(",")
                .map(skill => skill.trim());

            filter.skills = {
                $in: skillArray
            };
        }

        // -----------------------------
        // PAGINATION
        // -----------------------------

        const currentPage = Math.max(Number(page), 1);
        const itemsPerPage = Math.min(
            Math.max(Number(limit), 1),
            50
        );

        const skip =
            (currentPage - 1) * itemsPerPage;


        let sortOption = {
            createdAt: -1
        };

        if (sort === "oldest") {
            sortOption = {
                createdAt: 1
            };
        }

        if (sort === "salary-high") {
            sortOption = {
                salaryMax: -1
            };
        }

        if (sort === "salary-low") {
            sortOption = {
                salaryMin: 1
            };
        }

        // -----------------------------
        // QUERY DATABASE
        // -----------------------------

        const jobs = await Job.find(filter)
            .populate("recruiter", "name email")
            .sort(sortOption)
            .skip(skip)
            .limit(itemsPerPage);

        // Count matching jobs
        const totalJobs = await Job.countDocuments(filter);

        const totalPages = Math.ceil(
            totalJobs / itemsPerPage
        );

        // -----------------------------
        // RESPONSE
        // -----------------------------

        res.status(200).json({
            success: true,

            pagination: {
                currentPage,
                itemsPerPage,
                totalJobs,
                totalPages
            },

            data: jobs
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
            error: error.message
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

        
        const allowedFields = [
            "title",
            "company",
            "description",
            "location",
            "jobType",
            "salaryMin",
            "salaryMax",
            "experienceMin",
            "skills",
            "deadline",
            "status"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update"
            });
        }

        if (
            updates.salaryMin !== undefined &&
            updates.salaryMax !== undefined &&
            updates.salaryMin > updates.salaryMax
        ) {
            return res.status(400).json({
                success: false,
                message: "Minimum salary cannot exceed maximum salary"
            });
        }

        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { $set: updates },
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