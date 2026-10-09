const express = require("express");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const jobRoutes = require("./routes/job.routes");
const applicationRoutes = require("./routes/application.routes");

const {
    notFound,
    errorHandler
} = require("./middleware/error.middleware");

const app = express();

app.use(express.json());


// Security headers
app.use(helmet());

// Parse JSON request bodies
app.use(express.json({ limit: "20kb" }));

// Limit repeated authentication requests
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication requests. Please try again later."
    }
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "JobTrack Backend API is running 🚀"
    });
});

// app.use("" , userRoutes);
app.use("/api/users" , userRoutes);

app.use("/api/auth" , authRoutes);

app.use("/api/jobs" , jobRoutes);

app.use("/api/applications" , applicationRoutes)

app.use(notFound);
app.use(errorHandler);

module.exports = app;