const express = require("express");

const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} = require("../controllers/user.controller");

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// All routes below require an administrator
router.use(protect, authorizeRoles("admin"));

router.get("/", getUsers);

router.get(
    "/:id",
    validateObjectId("id"),
    getUserById
);

router.put(
    "/:id",
    validateObjectId("id"),
    updateUser
);

router.delete(
    "/:id",
    validateObjectId("id"),
    deleteUser
);

module.exports = router;
