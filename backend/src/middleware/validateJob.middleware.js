const JOB_TYPES = [
    "full-time",
    "part-time",
    "internship",
    "contract",
];

const validateJob = (req, res, next) => {
    const {
        title,
        company,
        description,
        location,
        jobType,
        salaryMin,
        salaryMax,
        experienceMin,
        skills,
        deadline,
    } = req.body;

    const errors = [];

    // Required fields
    const requiredFields = {
        title,
        company,
        description,
        location,
        jobType,
        deadline,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
        if (typeof value !== "string" || value.trim().length === 0) {
            errors.push(`${field} is required and must be a non-empty string`);
        }
    }

    // String length validation
    if (typeof title === "string" && title.trim().length > 100) {
        errors.push("Title cannot exceed 100 characters");
    }

    if (typeof company === "string" && company.trim().length > 100) {
        errors.push("Company cannot exceed 100 characters");
    }

    // Job type validation
    if (typeof jobType === "string" && !JOB_TYPES.includes(jobType)) {
        errors.push(
            "jobType must be full-time, part-time, internship, or contract"
        );
    }

    // Numeric validation
    const validateOptionalNumber = (value, field) => {
        if (value === undefined || value === null || value === "") {
            return;
        }

        if (
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            value < 0
        ) {
            errors.push(`${field} must be a non-negative number`);
        }
    };

    validateOptionalNumber(salaryMin, "salaryMin");
    validateOptionalNumber(salaryMax, "salaryMax");
    validateOptionalNumber(experienceMin, "experienceMin");

    if (
        typeof salaryMin === "number" &&
        typeof salaryMax === "number" &&
        salaryMin > salaryMax
    ) {
        errors.push("Minimum salary cannot exceed maximum salary");
    }

    // Skills validation
    if (skills !== undefined && !Array.isArray(skills)) {
        errors.push("Skills must be an array of strings");
    } else if (
        Array.isArray(skills) &&
        skills.some(
            (skill) =>
                typeof skill !== "string" ||
                skill.trim().length === 0
        )
    ) {
        errors.push("Each skill must be a non-empty string");
    }

    // Deadline validation
    if (
        typeof deadline === "string" &&
        deadline.trim() !== "" &&
        Number.isNaN(Date.parse(deadline))
    ) {
        errors.push("Deadline must be a valid date");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Job validation failed",
            errors,
        });
    }

    next();
};

module.exports = validateJob;