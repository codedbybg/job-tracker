const express = require("express");

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
} = require("../controllers/job.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const validateObjectId = require("../middleware/validateObjectId");
const validateJob = require("../middleware/validateJob.middleware");
const validateJobUpdate = require("../middleware/validateJobUpdate.middleware");

const router = express.Router();

// Public: get all jobs
router.get("/", getJobs);

// Recruiter/Admin: get jobs owned by the logged-in recruiter
// Admins will see only jobs owned by their own user ID with this query.
router.get(
  "/my-jobs",
  protect,
  authorizeRoles("recruiter", "admin"),
  getMyJobs,
);

// Public: get a single job
// Keep this AFTER /my-jobs.
router.get("/:id", validateObjectId("id"), getJobById);

// Recruiter/Admin: create a job
router.post(
    "/",
    protect,
    authorizeRoles("recruiter", "admin"),
    validateJob,
    createJob
);

// Recruiter/Admin: update a job
router.put(
    "/:id",
    protect,
    authorizeRoles("recruiter", "admin"),
    validateObjectId("id"),
    validateJobUpdate,
    updateJob
);

// Recruiter/Admin: delete a job
router.delete(
  "/:id",
  protect,
  authorizeRoles("recruiter", "admin"),
  validateObjectId("id"),
  deleteJob,
);

module.exports = router;