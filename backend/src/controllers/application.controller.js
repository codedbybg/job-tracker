
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");

// APPLY FOR A JOB
const applyForJob = async (req, res) => {
    try {
        // Only candidates can apply for jobs.
        if (req.user.role !== "candidate") {
            return res.status(403).json({
                success: false,
                message: "Only candidates can apply for jobs",
            });
        }

        // FIX: The frontend sends jobId in req.body.
        const { jobId, coverLetter = "" } = req.body;

        // Validate job ID.
        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required",
            });
        }

        // Validate cover letter.
        if (
            typeof coverLetter !== "string" ||
            coverLetter.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Cover letter must be a string of at most 2000 characters",
            });
        }

        // Find the job.
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        // Ensure the job is accepting applications.
        if (job.status !== "open") {
            return res.status(409).json({
                success: false,
                message: "This job is no longer accepting applications",
            });
        }

        // Validate the application deadline.
        const deadlineTime = new Date(job.deadline).getTime();

        if (
            !Number.isFinite(deadlineTime) ||
            deadlineTime <= Date.now()
        ) {
            return res.status(409).json({
                success: false,
                message: "Application deadline has passed or is invalid",
            });
        }

        // Prevent duplicate applications.
        const existingApplication = await Application.findOne({
            job: job._id,
            candidate: req.user.id,
        });

        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job",
            });
        }

        // Create the application.
        const application = await Application.create({
            job: job._id,
            candidate: req.user.id,
            coverLetter,
        });

        // Update the applicant count.
        await Job.findByIdAndUpdate(job._id, {
            $inc: { applicantsCount: 1 },
        });

        return res.status(201).json({
            success: true,
            message: "Job application submitted successfully",
            data: application,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job",
            });
        }

        // Invalid MongoDB ObjectId.
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
        }

        console.error("Apply for job error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit application",
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

        return res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        console.error("Get my applications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your applications"
        });
    }
};

// GET APPLICANTS FOR A JOB
const getApplicantsForJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Only the job owner or an admin can view applicants.
        const isOwner = job.recruiter.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only view applicants for your own jobs"
            });
        }

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

        return res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        console.error("Get applicants error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch applicants"
        });
    }
};

// UPDATE APPLICATION STATUS
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

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status"
            });
        }

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        const job = await Job.findById(application.job);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Associated job not found"
            });
        }

        const isOwner = job.recruiter.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only update applications for your own jobs"
            });
        }

        application.status = status;
        await application.save();

        return res.status(200).json({
            success: true,
            message: "Application status updated successfully",
            data: application
        });
    } catch (error) {
        console.error("Update application status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update application status"
        });
    }
};

// WITHDRAW MY APPLICATION
const withdrawMyApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Only the candidate who submitted the application can withdraw it.
        if (application.candidate.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only withdraw your own applications"
            });
        }

        const withdrawableStatuses = [
            "applied",
            "shortlisted",
            "interview"
        ];

        if (!withdrawableStatuses.includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: `An application with status "${application.status}" cannot be withdrawn`
            });
        }

        application.status = "withdrawn";
        await application.save();

        return res.status(200).json({
            success: true,
            message: "Application withdrawn successfully",
            data: application
        });
    } catch (error) {
        console.error("Withdraw application error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to withdraw application"
        });
    }
};

// GET APPLICATION BY ID
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

        return res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error("Get application error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch application"
        });
    }
};

// GET MY APPLICATION STATISTICS
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
                    total: { $sum: 1 },

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

        return res.status(200).json({
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
        console.error("Candidate application stats error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch application statistics"
        });
    }
};

// GET RECRUITER APPLICATION STATISTICS
const getRecruiterApplicationStats = async (req, res) => {
    try {
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

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Recruiter application stats error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch recruiter statistics"
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
    getRecruiterApplicationStats,
    withdrawMyApplication
};
