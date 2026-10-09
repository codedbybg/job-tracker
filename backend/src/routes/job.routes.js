const express = require("express");
const {createJob , getJobs , getJobById , updateJob , deleteJob} = require("../controllers/job.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// public
router.get("/" , getJobs);

router.get("/:id" , validateObjectId("id"), getJobById);

// RECRUITER + ADMIN
router.post(
    "/" , 
    protect , 
    authorizeRoles("recruiter" , "admin") ,
    createJob
);

// RECRUITER + ADMIN
router.put(
    "/:id",
    protect,
    authorizeRoles("recruiter" , "admin"),
    validateObjectId("id"),
    updateJob
);

// RECRUITER + ADMIN
router.delete(
    "/:id",
    protect,
    authorizeRoles("recruiter" , "admin"),
    validateObjectId("id"),
    deleteJob
);

module.exports = router;