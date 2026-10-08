const express = require("express");

const {register , login , getMe , getCandidateDashboard , 
    getRecruiterDashboard, getAdminDashboard} = require("../controllers/auth.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// public routes
router.post("/register" , register);
router.post("/login" , login);

// authenticated route
router.get("/me" , protect , getMe)

// candidate only
router.get(
    "/candidate-dashboard" ,
    protect , 
    authorizeRoles("candidate") , 
    getCandidateDashboard 
);

// RECRUITER ONLY

router.get(
    "/recruiter-dashboard",
    protect,
    authorizeRoles("recruiter"),
    getRecruiterDashboard
);


// ADMIN ONLY

router.get(
    "/admin-dashboard",
    protect,
    authorizeRoles("admin"),
    getAdminDashboard
);

module.exports = router;