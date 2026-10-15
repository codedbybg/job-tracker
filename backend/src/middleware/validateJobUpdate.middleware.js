
const JOB_TYPES = [
    "full-time",
    "part-time",
    "internship",
    "contract",
];

const JOB_STATUSES = ["open", "closed"];

const validateJobUpdate = (req, res, next) => {
    const errors = [];

    const allowedFields = [
        "title",
        "company",
        "description",
        "location",
        "jobType",
        "salaryMin",
        "salaryMax",
        "experienceMin",
        "skills",
        "deadline",
        "status",
    ];

    // Reject unsupported fields
    const unsupportedFields = Object.keys(req.body).filter(
        (field) => !allowedFields.includes(field)
    );

    if (unsupportedFields.length > 0) {
        errors.push(
            `Unsupported fields: ${unsupportedFields.join(", ")}`
        );
    }

    // Prevent empty update requests
    if (Object.keys(req.body).length === 0) {
        errors.push("At least one field is required for an update");
    }

    // Validate text fields only when supplied
    const textFields = [
        "title",
        "company",
        "description",
        "location",
    ];

    for (const field of textFields) {
        if (field in req.body) {
            const value = req.body[field];

            if (typeof value !== "string" || value.trim() === "") {
                errors.push(`${field} must be a non-empty string`);
            }
        }
    }

    if (
        typeof req.body.title === "string" &&
        req.body.title.trim().length > 100
    ) {
        errors.push("Title cannot exceed 100 characters");
    }

    if (
        typeof req.body.company === "string" &&
        req.body.company.trim().length > 100
    ) {
        errors.push("Company cannot exceed 100 characters");
    }

    // Validate job type
    if (
        "jobType" in req.body &&
        !JOB_TYPES.includes(req.body.jobType)
    ) {
        errors.push(
            "jobType must be full-time, part-time, internship, or contract"
        );
    }

    // Validate status
    if (
        "status" in req.body &&
        !JOB_STATUSES.includes(req.body.status)
    ) {
        errors.push("status must be open or closed");
    }

    // Validate numeric fields
    const numericFields = [
        "salaryMin",
        "salaryMax",
        "experienceMin",
    ];

    for (const field of numericFields) {
        if (field in req.body) {
            const value = req.body[field];

            if (
                typeof value !== "number" ||
                !Number.isFinite(value) ||
                value < 0
            ) {
                errors.push(`${field} must be a non-negative number`);
            }
        }
    }

    // Compare salary values when both are supplied
    if (
        typeof req.body.salaryMin === "number" &&
        typeof req.body.salaryMax === "number" &&
        req.body.salaryMin > req.body.salaryMax
    ) {
        errors.push(
            "Minimum salary cannot exceed maximum salary"
        );
    }

    // Validate skills
    if ("skills" in req.body) {
        if (!Array.isArray(req.body.skills)) {
            errors.push("Skills must be an array of strings");
        } else if (
            req.body.skills.some(
                (skill) =>
                    typeof skill !== "string" ||
                    skill.trim() === ""
            )
        ) {
            errors.push("Each skill must be a non-empty string");
        }
    }

    // Validate deadline
    if ("deadline" in req.body) {
        const deadline = req.body.deadline;

        if (
            typeof deadline !== "string" ||
            deadline.trim() === "" ||
            Number.isNaN(Date.parse(deadline))
        ) {
            errors.push("Deadline must be a valid date");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Job update validation failed",
            errors,
        });
    }

    next();
};

module.exports = validateJobUpdate;
