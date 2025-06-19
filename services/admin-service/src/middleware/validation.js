const { body, validationResult } = require("express-validator");

// Validation rules for admin registration
const validateRegistration = [
    body("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage(
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
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
    body("role")
        .isIn(["super_admin", "admin", "librarian"])
        .withMessage("Role must be super_admin, admin, or librarian")
        .custom((value, { req }) => {
            // Only super_admin can create super_admin or admin roles
            if (
                (value === "super_admin" || value === "admin") &&
                req.admin?.role !== "super_admin"
            ) {
                throw new Error(
                    "Only super admin can create admin or super admin accounts"
                );
            }
            // Admin can only create librarian
            if (value === "admin" && req.admin?.role === "admin") {
                throw new Error("Admin can only create librarian accounts");
            }
            return true;
        }),
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

// Validation rules for role update
const validateRoleUpdate = [
    body("role")
        .isIn(["super_admin", "admin", "librarian"])
        .withMessage("Role must be super_admin, admin, or librarian")
        .custom((value, { req }) => {
            // Only super_admin can set super_admin or admin roles
            if (
                (value === "super_admin" || value === "admin") &&
                req.admin?.role !== "super_admin"
            ) {
                throw new Error(
                    "Only super admin can assign admin or super admin roles"
                );
            }
            // Admin can only set librarian role
            if (value === "admin" && req.admin?.role === "admin") {
                throw new Error("Admin can only assign librarian role");
            }
            return true;
        }),
];

// Validation rules for user status update
const validateUserStatusUpdate = [
    body("status")
        .isIn(["active", "suspended", "inactive"])
        .withMessage("Status must be active, suspended, or inactive"),
    body("reason")
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage("Reason must be provided and less than 255 characters"),
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
    validateRoleUpdate,
    validateUserStatusUpdate,
    validateRefreshToken,
    handleValidationErrors,
};
