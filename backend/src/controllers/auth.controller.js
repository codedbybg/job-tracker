const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// REGISTER USER

const register = async (req, res) => {
  try {
    const { name, email, password, phone, location, role } = req.body;

    // 1. Validate required field types
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password must be strings",
      });
    }

    // 2. Validate name
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 50 characters",
      });
    }

    // 3. Validate email
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // 4. Validate password
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters",
      });
    }

    // 5. Validate the selected role.
    // Public registration must never create admin accounts.
    const allowedRoles = ["candidate", "recruiter"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid account role: candidate or recruiter",
      });
    }

    // 6. Check whether the email is already registered
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // 7. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 8. Create the user with the selected role
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      location,
      role,
    });

    // 9. Return safe user information
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "name and email are required",
      });
    }

    // 2. Find user and explicity include password
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // 3. Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(409).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // 4. Check Account Status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // 5. Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    );

    // 6. Send Response
    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

const getCandidateDashboard = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to candidate dashboard",
    user: req.user,
  });
};

const getRecruiterDashboard = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to recruiter dashboard",
    user: req.user,
  });
};

const getAdminDashboard = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to admin dashboard",
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  getMe,
  getCandidateDashboard,
  getRecruiterDashboard,
  getAdminDashboard,
};