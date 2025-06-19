const { body, validationResult } = require("express-validator");

// Validation rules for user registration
const validateRegistration = [
    body("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage(
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        ),
    body("firstName")
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage(
            "First name is required and must be less than 50 characters"
        ),
    body("lastName")
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage(
            "Last name is required and must be less than 50 characters"
        ),
    body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Please provide a valid phone number"),
];

// Validation rules for login
const validateLogin = [
    body("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    body("password").notEmpty().withMessage("Password is required"),
];

// Validation rules for profile update
const validateProfileUpdate = [
    body("firstName")
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage("First name must be less than 50 characters"),
    body("lastName")
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage("Last name must be less than 50 characters"),
    body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Please provide a valid phone number"),
];

// Validation rules for refresh token
const validateRefreshToken = [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });
    }

    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateProfileUpdate,
    validateRefreshToken,
    handleValidationErrors,
};
