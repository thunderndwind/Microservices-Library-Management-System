const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticateToken, requirePermission } = require("../middleware/auth");
const {
    validateUserStatusUpdate,
    handleValidationErrors,
} = require("../middleware/validation");
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
} = require("../controllers/userController");

const router = express.Router();

// Rate limiting for user management routes
const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// All routes require authentication and 'manage_users' permission
router.use(authenticateToken);
router.use(requirePermission("manage_users"));

// Get all users
router.get("/", userLimiter, getAllUsers);

// Get user by ID
router.get("/:id", userLimiter, getUserById);

// Update user status
router.put(
    "/:id/status",
    userLimiter,
    validateUserStatusUpdate,
    handleValidationErrors,
    updateUserStatus
);

// Delete user (admin only)
router.delete(
    "/:id",
    userLimiter,
    requirePermission("manage_admins"), // Only admins can delete
    deleteUser
);

module.exports = router;
