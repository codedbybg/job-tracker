
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");

const getAdminStats = async (req, res) => {
    try {
        const [
            totalUsers,
            candidates,
            recruiters,
            activeUsers,
            totalJobs,
            openJobs,
            closedJobs,
            totalApplications,
            applicationStatuses,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "candidate" }),
            User.countDocuments({ role: "recruiter" }),
            User.countDocuments({ isActive: true }),
            Job.countDocuments(),
            Job.countDocuments({ status: "open" }),
            Job.countDocuments({ status: "closed" }),
            Application.countDocuments({ status: { $ne: "withdrawn" } }),
            Application.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const statusCounts = {
            applied: 0,
            shortlisted: 0,
            interview: 0,
            selected: 0,
            rejected: 0,
            withdrawn: 0,
        };

        for (const item of applicationStatuses) {
            if (Object.prototype.hasOwnProperty.call(statusCounts, item._id)) {
                statusCounts[item._id] = item.count;
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    candidates,
                    recruiters,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers,
                },
                jobs: {
                    total: totalJobs,
                    open: openJobs,
                    closed: closedJobs,
                    other: totalJobs - openJobs - closedJobs,
                },
                applications: {
                    total: totalApplications,
                    ...statusCounts,
                },
            },
        });
    } catch (error) {
        console.error("Admin statistics error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to load admin statistics",
        });
    }
};

module.exports = { getAdminStats };
