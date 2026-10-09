const express = require("express");
const {
    applyForJob,
    getMyApplications , 
    getApplicantsForJob , 
    updateApplicationStatus,
    getApplicationById,
    getMyApplicationStats,
    getRecruiterApplicationStats
} = require("../controllers/application.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// Candidate applies for a job
router.post(
    "/:jobId",
    protect,
    authorizeRoles("candidate"),
    validateObjectId("id"),
    applyForJob
);

// Candidate views their own applications
router.get(
    "/my",
    protect,
    authorizeRoles("candidate"),
    getMyApplications
);

// Recruiter/Admin: view applicants for a job
router.get(
    "/job/:jobId",
    protect,
    authorizeRoles("recruiter", "admin"),
    getApplicantsForJob
);


router.get(
    "/my/stats",
    protect,
    authorizeRoles("candidate"),
    getMyApplicationStats
);

router.get(
    "/recruiter/stats",
    protect,
    authorizeRoles("recruiter", "admin"),
    getRecruiterApplicationStats
);

router.get(
    "/:id",
    protect,
    authorizeRoles("candidate", "recruiter", "admin"),
    getApplicationById
);


// Recruiter/Admin: update application status
router.patch(
    "/:id/status",
    protect,
    authorizeRoles("recruiter", "admin"),
    updateApplicationStatus
);

module.exports = router;