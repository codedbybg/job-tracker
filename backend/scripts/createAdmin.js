
const readline = require("readline");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const connectDB = require("../src/config/db");
const User = require("../src/models/User");

const ask = (rl, question) =>
    new Promise((resolve) => rl.question(question, resolve));

function askHidden(question) {
    return new Promise((resolve, reject) => {
        const input = process.stdin;

        if (!input.isTTY || typeof input.setRawMode !== "function") {
            reject(
                new Error(
                    "Run this script directly in a terminal that supports hidden password input."
                )
            );
            return;
        }

        let value = "";

        process.stdout.write(question);
        input.resume();
        input.setRawMode(true);
        input.setEncoding("utf8");

        const cleanup = () => {
            input.removeListener("data", onData);
            input.setRawMode(false);
            input.pause();
        };

        const onData = (key) => {
            if (key === "\u0003") {
                cleanup();
                process.stdout.write("\n");
                reject(new Error("Admin setup cancelled."));
                return;
            }

            if (key === "\r" || key === "\n") {
                cleanup();
                process.stdout.write("\n");
                resolve(value);
                return;
            }

            if (key === "\u007f" || key === "\b") {
                value = value.slice(0, -1);
                return;
            }

            if (key >= " " && key !== "\u007f") {
                value += key;
            }
        };

        input.on("data", onData);
    });
}

async function createAdmin() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        console.log("\n=== Private JobTrack Admin Setup ===");
        console.log("This script does not create a public API endpoint.\n");

        const name = (await ask(rl, "Admin name: ")).trim();
        const email = (await ask(rl, "Admin email: "))
            .trim()
            .toLowerCase();

        rl.close();

        if (name.length < 2 || name.length > 50) {
            throw new Error("Name must be between 2 and 50 characters.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error("Enter a valid email address.");
        }

        const password = await askHidden("Admin password (hidden): ");
        const confirmation = await askHidden("Confirm password (hidden): ");

        if (password !== confirmation) {
            throw new Error("Passwords do not match.");
        }

        if (password.length < 12 || password.length > 72) {
            throw new Error(
                "Admin password must be 12–72 characters long."
            );
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from backend/.env.");
        }

        await connectDB();

        const existingAdmin = await User.exists({ role: "admin" });

        if (existingAdmin) {
            throw new Error(
                "An Admin account already exists. No account was created."
            );
        }

        const existingUser = await User.findOne({ email }).select("_id");

        if (existingUser) {
            throw new Error(
                "This email already belongs to an account. No role was changed."
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            isActive: true,
        });

        console.log("\nAdmin account created successfully.");
        console.log(`Email: ${admin.email}`);
        console.log(`User ID: ${admin._id}`);
        console.log("You can now log in using the normal login page.");
    } finally {
        if (!rl.closed) {
            rl.close();
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

createAdmin().catch((error) => {
    console.error("\nAdmin setup failed:", error.message);
    process.exitCode = 1;
});
