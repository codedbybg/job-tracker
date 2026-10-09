
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

const errorHandler = (err, req, res, next) => {
    console.error(err);

    // Malformed JSON request body
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    // Payload too large
    if (err.status === 413) {
        return res.status(413).json({
            success: false,
            message: "Request body is too large"
        });
    }

    // Invalid MongoDB document ID
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid resource ID"
        });
    }

    // Mongoose schema validation
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: Object.values(err.errors).map(
                item => item.message
            )
        });
    }

    // Duplicate unique field
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "A record with this value already exists"
        });
    }

    const statusCode =
        Number.isInteger(err.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode < 500
            ? err.statusCode
            : 500;

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500
            ? "Internal server error"
            : err.message
    });
};

module.exports = {
    notFound,
    errorHandler
};
