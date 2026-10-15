
const express = require("express");

const { getAdminStats } = require("../controllers/admin.controller");
const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/stats", getAdminStats);

module.exports = router;
