const express = require("express");
const {createJob , getJobs , getJobById , updateJob , deleteJob} = require("../controllers/job.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// public
router.get("/" , getJobs);

router.get("/:id" , getJobById);

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
    updateJob
);

// RECRUITER + ADMIN
router.delete(
    "/:id",
    protect,
    authorizeRoles("recruiter" , "admin"),
    deleteJob
);

module.exports = router;