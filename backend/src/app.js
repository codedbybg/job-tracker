const express = require("express");

const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const jobRoutes = require("./routes/job.routes");

const app = express();

app.use(express.json());

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

module.exports = app;