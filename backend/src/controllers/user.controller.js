
const mongoose = require("mongoose");
const User = require("../models/User");

const SAFE_USER_FIELDS =
    "_id name email role phone location profileImage resume isActive createdAt updatedAt";

const getUsers = async (req, res) => {
    try {
        const { role, search, page = "1", limit = "20" } = req.query;

        const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
        const pageSize = Math.min(
            100,
            Math.max(1, Number.parseInt(limit, 10) || 20)
        );

        const filter = {};

        if (role) {
            if (!["candidate", "recruiter", "admin"].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role filter",
                });
            }

            filter.role = role;
        }

        if (typeof search === "string" && search.trim()) {
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.$or = [
                { name: { $regex: escaped, $options: "i" } },
                { email: { $regex: escaped, $options: "i" } },
            ];
        }

        const [users, totalUsers] = await Promise.all([
            User.find(filter)
                .select(SAFE_USER_FIELDS)
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: users,
            pagination: {
                currentPage,
                limit: pageSize,
                totalUsers,
                totalPages: Math.ceil(totalUsers / pageSize),
            },
        });
    } catch (error) {
        console.error("Get users error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select(SAFE_USER_FIELDS)
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Get user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const actorId = String(req.user.id);
        const isEditingSelf = actorId === String(id);

        const allowedFields = [
            "name",
            "email",
            "phone",
            "location",
            "profileImage",
            "resume",
            "isActive",
            "role",
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No supported fields provided for update",
            });
        }

        // The admin API cannot grant or change the administrator role.
        if (Object.prototype.hasOwnProperty.call(updates, "role")) {
            if (!["candidate", "recruiter"].includes(updates.role)) {
                return res.status(400).json({
                    success: false,
                    message: "This endpoint can assign only candidate or recruiter roles",
                });
            }

            if (isEditingSelf) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot change your own role",
                });
            }
        }

        if (
            isEditingSelf &&
            Object.prototype.hasOwnProperty.call(updates, "isActive") &&
            updates.isActive === false
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot deactivate your own account",
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(updates, "name") &&
            (typeof updates.name !== "string" ||
                updates.name.trim().length < 2 ||
                updates.name.trim().length > 50)
        ) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 50 characters",
            });
        }

        if (Object.prototype.hasOwnProperty.call(updates, "name")) {
            updates.name = updates.name.trim();
        }

        if (Object.prototype.hasOwnProperty.call(updates, "email")) {
            if (typeof updates.email !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Email must be a string",
                });
            }

            updates.email = updates.email.trim().toLowerCase();

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid email address",
                });
            }
        }

        if (
            Object.prototype.hasOwnProperty.call(updates, "isActive") &&
            typeof updates.isActive !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false",
            });
        }

        for (const field of ["phone", "location", "profileImage", "resume"]) {
            if (
                Object.prototype.hasOwnProperty.call(updates, field) &&
                typeof updates[field] !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a string`,
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
                context: "query",
            }
        ).select(SAFE_USER_FIELDS);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "That email address is already registered",
            });
        }

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user data",
            });
        }

        console.error("Update user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (String(req.user.id) === String(id)) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete your own administrator account",
            });
        }

        const targetUser = await User.findById(id).select("_id role");

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Administrator accounts must be managed outside this API.
        if (targetUser.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrator accounts cannot be deleted through user management",
            });
        }

        await User.deleteOne({ _id: targetUser._id });

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
};
