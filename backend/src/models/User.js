
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            maxlength: 72,
            select: false,
        },

        role: {
            type: String,
            required: true,
            enum: ["candidate", "recruiter", "admin"],
            default: "candidate",
            immutable: true,
        },

        phone: {
            type: String,
            trim: true,
        },

        location: {
            type: String,
            trim: true,
        },

        profileImage: {
            type: String,
            default: "",
        },

        resume: {
            type: String,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
