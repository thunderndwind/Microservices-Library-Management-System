const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticateToken, adminOrSuperAdmin } = require("../middleware/auth");
const {
    validateRoleUpdate,
    handleValidationErrors,
} = require("../middleware/validation");
const {
    getAllAdmins,
    updateAdminRole,
    healthCheck,
} = require("../controllers/adminController");

const router = express.Router();

// Rate limiting for admin management routes
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per windowMs
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Health check endpoint (public)
router.get("/health", healthCheck);

// All other routes require authentication and admin or super_admin role
router.use(authenticateToken);
router.use(adminOrSuperAdmin);

// Get all admins/librarians
router.get("/", adminLimiter, getAllAdmins);

// Update admin role
router.put(
    "/:id/role",
    adminLimiter,
    validateRoleUpdate,
    handleValidationErrors,
    updateAdminRole
);

module.exports = router;
