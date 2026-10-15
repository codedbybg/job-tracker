const express = require("express");

const {
    applyForJob,
    getMyApplications,
    getApplicantsForJob,
    updateApplicationStatus,
    getApplicationById,
    getMyApplicationStats,
    getRecruiterApplicationStats,
    withdrawMyApplication,
} = require("../controllers/application.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// Candidate applies for a job.
// POST /api/applications
// Request body: { jobId, coverLetter }
router.post(
    "/",
    protect,
    authorizeRoles("candidate"),
    applyForJob
);

// Candidate views their own applications.
// GET /api/applications/my
router.get(
    "/my",
    protect,
    authorizeRoles("candidate"),
    getMyApplications
);

// Candidate views their application statistics.
// GET /api/applications/my/stats
router.get(
    "/my/stats",
    protect,
    authorizeRoles("candidate"),
    getMyApplicationStats
);

// Recruiter/Admin views application statistics.
// GET /api/applications/recruiter/stats
router.get(
    "/recruiter/stats",
    protect,
    authorizeRoles("recruiter", "admin"),
    getRecruiterApplicationStats
);

// Recruiter/Admin views applicants for a job.
// GET /api/applications/job/:jobId
router.get(
    "/job/:jobId",
    protect,
    authorizeRoles("recruiter", "admin"),
    validateObjectId("jobId"),
    getApplicantsForJob
);

// Recruiter/Admin updates application status.
// PATCH /api/applications/:id/status
router.patch(
    "/:id/status",
    protect,
    authorizeRoles("recruiter", "admin"),
    validateObjectId("id"),
    updateApplicationStatus
);

// Candidate withdraws their application.
// PATCH /api/applications/:id/withdraw
router.patch(
    "/:id/withdraw",
    protect,
    authorizeRoles("candidate"),
    validateObjectId("id"),
    withdrawMyApplication
);

// Get a specific application.
// GET /api/applications/:id
router.get(
    "/:id",
    protect,
    authorizeRoles("candidate", "recruiter", "admin"),
    validateObjectId("id"),
    getApplicationById
);

module.exports = router;