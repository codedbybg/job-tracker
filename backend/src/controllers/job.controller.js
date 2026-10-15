
const Job = require("../models/Job");
const Application = require("../models/Application");

// ============================================
// CREATE JOB
// ============================================
const createJob = async (req, res) => {
    try {
        const {
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
        } = req.body;

        if (
            !title ||
            !company ||
            !description ||
            !location ||
            !jobType ||
            !deadline
        ) {
            return res.status(400).json({
                success: false,
                message: "Required job fields are missing",
            });
        }

        if (
            salaryMin !== undefined &&
            salaryMin !== "" &&
            salaryMax !== undefined &&
            salaryMax !== "" &&
            Number(salaryMin) > Number(salaryMax)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum salary cannot be greater than maximum salary",
            });
        }

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
            recruiter: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: "Job created successfully",
            data: job,
        });
    } catch (error) {
        console.error("Create job error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create job",
            error: error.message,
        });
    }
};

// ============================================
// GET ALL JOBS
// Search, filters, sorting and pagination
// ============================================
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
            limit = 10,
        } = req.query;

        if (
            minSalary !== undefined &&
            (minSalary === "" || !Number.isFinite(Number(minSalary)))
        ) {
            return res.status(400).json({
                success: false,
                message: "minSalary must be a valid number",
            });
        }

        if (
            maxSalary !== undefined &&
            (maxSalary === "" || !Number.isFinite(Number(maxSalary)))
        ) {
            return res.status(400).json({
                success: false,
                message: "maxSalary must be a valid number",
            });
        }

        if (
            minSalary !== undefined &&
            maxSalary !== undefined &&
            Number(minSalary) > Number(maxSalary)
        ) {
            return res.status(400).json({
                success: false,
                message: "minSalary cannot exceed maxSalary",
            });
        }

        const filter = {
            status: "open",
        };

        if (keyword?.trim()) {
            const safeKeyword = keyword.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { title: { $regex: safeKeyword, $options: "i" } },
                { company: { $regex: safeKeyword, $options: "i" } },
                { description: { $regex: safeKeyword, $options: "i" } },
            ];
        }

        if (location?.trim()) {
            const safeLocation = location.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.location = {
                $regex: safeLocation,
                $options: "i",
            };
        }

        if (jobType) {
            filter.jobType = jobType;
        }

        // Find jobs whose salary range overlaps the selected range.
        if (minSalary !== undefined) {
            filter.salaryMax = { $gte: Number(minSalary) };
        }

        if (maxSalary !== undefined) {
            filter.salaryMin = { $lte: Number(maxSalary) };
        }

        if (skills?.trim()) {
            const skillArray = skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);

            if (skillArray.length > 0) {
                filter.skills = { $in: skillArray };
            }
        }

        const requestedPage = Number(page);
        const requestedLimit = Number(limit);

        if (
            !Number.isInteger(requestedPage) ||
            requestedPage < 1 ||
            !Number.isInteger(requestedLimit) ||
            requestedLimit < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Page and limit must be positive integers",
            });
        }

        const currentPage = requestedPage;
        const itemsPerPage = Math.min(requestedLimit, 50);
        const skip = (currentPage - 1) * itemsPerPage;

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            "salary-high": { salaryMax: -1, createdAt: -1 },
            "salary-low": { salaryMin: 1, createdAt: -1 },
        };

        const sortOption = sortOptions[sort] || sortOptions.newest;

        const [jobs, totalJobs] = await Promise.all([
            Job.find(filter)
                .populate("recruiter", "name email")
                .sort(sortOption)
                .skip(skip)
                .limit(itemsPerPage),
            Job.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            pagination: {
                currentPage,
                itemsPerPage,
                totalJobs,
                totalPages: Math.ceil(totalJobs / itemsPerPage),
            },
            data: jobs,
        });
    } catch (error) {
        console.error("Get jobs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
        });
    }
};

// ============================================
// GET SINGLE JOB
// ============================================
const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id).populate(
            "recruiter",
            "name email"
        );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: job,
        });
    } catch (error) {
        console.error("Get job by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch job",
        });
    }
};

// ============================================
// UPDATE JOB
// ============================================
const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        const isOwner = job.recruiter.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own jobs",
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
            "status",
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
                message: "No valid fields provided for update",
            });
        }

        const nextSalaryMin =
            updates.salaryMin !== undefined
                ? updates.salaryMin
                : job.salaryMin;

        const nextSalaryMax =
            updates.salaryMax !== undefined
                ? updates.salaryMax
                : job.salaryMax;

        if (
            nextSalaryMin !== undefined &&
            nextSalaryMin !== "" &&
            nextSalaryMax !== undefined &&
            nextSalaryMax !== "" &&
            Number(nextSalaryMin) > Number(nextSalaryMax)
        ) {
            return res.status(400).json({
                success: false,
                message: "Minimum salary cannot exceed maximum salary",
            });
        }

        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Job updated successfully",
            data: updatedJob,
        });
    } catch (error) {
        console.error("Update job error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update job",
        });
    }
};

// ============================================
// DELETE JOB
// ============================================
const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        const isOwner = job.recruiter.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own jobs",
            });
        }

        await Job.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Job deleted successfully",
        });
    } catch (error) {
        console.error("Delete job error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete job",
        });
    }
};

// ============================================
// GET MY JOBS + APPLICANT STATISTICS
// Recruiters: their own jobs
// Admins: all jobs
// ============================================
const getMyJobs = async (req, res) => {
    try {
        const jobFilter =
            req.user.role === "admin"
                ? {}
                : { recruiter: req.user.id };

        const jobs = await Job.find(jobFilter)
            .populate("recruiter", "name email")
            .sort({ createdAt: -1 });

        const jobIds = jobs.map((job) => job._id);

        const stats = jobIds.length
            ? await Application.aggregate([
                  {
                      $match: {
                          job: { $in: jobIds },
                          // Withdrawn applications are not active applicants.
                          status: { $ne: "withdrawn" },
                      },
                  },
                  {
                      $group: {
                          _id: "$job",
                          totalApplicants: { $sum: 1 },
                          applied: {
                              $sum: {
                                  $cond: [
                                      { $eq: ["$status", "applied"] },
                                      1,
                                      0,
                                  ],
                              },
                          },
                          shortlisted: {
                              $sum: {
                                  $cond: [
                                      { $eq: ["$status", "shortlisted"] },
                                      1,
                                      0,
                                  ],
                              },
                          },
                          interview: {
                              $sum: {
                                  $cond: [
                                      { $eq: ["$status", "interview"] },
                                      1,
                                      0,
                                  ],
                              },
                          },
                          selected: {
                              $sum: {
                                  $cond: [
                                      { $eq: ["$status", "selected"] },
                                      1,
                                      0,
                                  ],
                              },
                          },
                          rejected: {
                              $sum: {
                                  $cond: [
                                      { $eq: ["$status", "rejected"] },
                                      1,
                                      0,
                                  ],
                              },
                          },
                      },
                  },
              ])
            : [];

        const statsMap = new Map(
            stats.map((item) => [item._id.toString(), item])
        );

        const jobsWithStats = jobs.map((job) => {
            const jobStats = statsMap.get(job._id.toString());

            return {
                ...job.toObject(),
                applicantStats: {
                    totalApplicants: jobStats?.totalApplicants || 0,
                    applied: jobStats?.applied || 0,
                    shortlisted: jobStats?.shortlisted || 0,
                    interview: jobStats?.interview || 0,
                    selected: jobStats?.selected || 0,
                    rejected: jobStats?.rejected || 0,
                },
            };
        });

        return res.status(200).json({
            success: true,
            count: jobsWithStats.length,
            data: jobsWithStats,
        });
    } catch (error) {
        console.error("Get my jobs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
        });
    }
};

module.exports = {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    deleteJob,
    getMyJobs,
};
