const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");

// Apply for a job
const applyForJob = async (req , res)=>{
    try {
        const {jobId} = req.params;
        const {coverLetter = ""} = req.body;

         // Validate cover letter
        if (
            typeof coverLetter !== "string" ||
            coverLetter.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Cover letter must be a string of at most 2000 characters"
            });
        }

        // Check whether the job exists
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Check whether the job is open
        if (job.status !== "open") {
            return res.status(409).json({
                success: false,
                message: "This job is no longer accepting applications"
            });
        }

        // Check the application deadline
        if (new Date(job.deadline) < new Date()) {
            return res.status(409).json({
                success: false,
                message: "Application deadline has passed"
            });
        }

        // Check for an existing application
        const existingApplication =
            await Application.findOne({
                job: jobId,
                candidate: req.user.id
            });

        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job"
            });
        }

        // Create application using authenticated user's ID
        const application = await Application.create({
            job: jobId,
            candidate: req.user.id,
            coverLetter
        });

        // Increase the job's applicant count
        await Job.findByIdAndUpdate(jobId, {
            $inc: { applicantsCount: 1 }
        });

        res.status(201).json({
            success: true,
            message: "Job application submitted successfully",
            data: application
        });


    } catch (error) {
        // Handle duplicate-key errors, including concurrent requests
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job"
            });
        }

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to submit application",
            error: error.message
        });
    }
};

// GET MY APPLICATIONS
const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            candidate: req.user.id
        })
            .populate(
                "job",
                "title company location jobType salaryMin salaryMax status deadline"
            )
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your applications",
            error: error.message
        });
    }
};


const getApplicantsForJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Find the job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Check job ownership
        const isOwner =
            job.recruiter.toString() === req.user.id;

        const isAdmin =
            req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only view applicants for your own jobs"
            });
        }

        // Find applications and populate candidate details
        const applications = await Application.find({
            job: jobId
        })
            .populate(
                "candidate",
                "name email phone location resume"
            )
            .populate(
                "job",
                "title company location jobType"
            )
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch applicants",
            error: error.message
        });
    }
};


const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "shortlisted",
            "interview",
            "selected",
            "rejected"
        ];

        // Validate requested status
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status"
            });
        }

        // Find the application
        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Find the associated job
        const job = await Job.findById(application.job);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Associated job not found"
            });
        }

        // Check ownership or admin access
        const isOwner =
            job.recruiter.toString() === req.user.id;

        const isAdmin =
            req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only update applications for your own jobs"
            });
        }

        // Update status
        application.status = status;

        await application.save();

        res.status(200).json({
            success: true,
            message: "Application status updated successfully",
            data: application
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update application status",
            error: error.message
        });
    }
};


const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findById(id)
            .populate(
                "candidate",
                "name email phone location resume"
            )
            .populate(
                "job",
                "title company location jobType salaryMin salaryMax deadline recruiter"
            );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        const isCandidate =
            application.candidate._id.toString() === req.user.id;

        const isAdmin = req.user.role === "admin";

        const isRecruiter =
            req.user.role === "recruiter" &&
            application.job.recruiter.toString() === req.user.id;

        if (!isCandidate && !isRecruiter && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to view this application"
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch application",
            error: error.message
        });
    }
};


const getMyApplicationStats = async (req, res) => {
    try {
        const candidateId = req.user.id;

        const stats = await Application.aggregate([
            {
                $match: {
                    candidate: new mongoose.Types.ObjectId(candidateId)
                }
            },
            {
                $group: {
                    _id: null,

                    total: {
                        $sum: 1
                    },

                    applied: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "applied"] },
                                1,
                                0
                            ]
                        }
                    },

                    shortlisted: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "shortlisted"] },
                                1,
                                0
                            ]
                        }
                    },

                    interviews: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "interview"] },
                                1,
                                0
                            ]
                        }
                    },

                    selected: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "selected"] },
                                1,
                                0
                            ]
                        }
                    },

                    rejected: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "rejected"] },
                                1,
                                0
                            ]
                        }
                    },

                    withdrawn: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "withdrawn"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    applied: 1,
                    shortlisted: 1,
                    interviews: 1,
                    selected: 1,
                    rejected: 1,
                    withdrawn: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0] || {
                total: 0,
                applied: 0,
                shortlisted: 0,
                interviews: 0,
                selected: 0,
                rejected: 0,
                withdrawn: 0
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch application statistics",
            error: error.message
        });
    }
};


const getRecruiterApplicationStats = async (req, res) => {
    try {
        // Find jobs belonging to the logged-in recruiter
        const recruiterJobs = await Job.find({
            recruiter: req.user.id
        }).select("_id");

        const jobIds = recruiterJobs.map(job => job._id);

        const stats = await Application.aggregate([
            {
                $match: {
                    job: { $in: jobIds }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            total: 0,
            applied: 0,
            shortlisted: 0,
            interviews: 0,
            selected: 0,
            rejected: 0,
            withdrawn: 0
        };

        const statusMap = {
            applied: "applied",
            shortlisted: "shortlisted",
            interview: "interviews",
            selected: "selected",
            rejected: "rejected",
            withdrawn: "withdrawn"
        };

        for (const item of stats) {
            const key = statusMap[item._id];

            if (key) {
                result[key] = item.count;
            }

            result.total += item.count;
        }

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch recruiter statistics",
            error: error.message
        });
    }
};


module.exports = {
    applyForJob,
    getMyApplications,
    getApplicantsForJob,
    updateApplicationStatus,
    getApplicationById,
    getMyApplicationStats,
    getRecruiterApplicationStats
};