const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticateToken, adminOrSuperAdmin } = require("../middleware/auth");
const {
    validateRegistration,
    validateLogin,
    validateProfileUpdate,
    validateRefreshToken,
    handleValidationErrors,
} = require("../middleware/validation");
const {
    register,
    login,
    getProfile,
    updateProfile,
    refreshToken,
    logout,
} = require("../controllers/authController");

const router = express.Router();

// Rate limiting for auth routes (stricter for admin)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs for admin auth routes
    message: {
        success: false,
        message: "Too many authentication attempts, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs (lower than user service)
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes (with rate limiting)
router.post(
    "/login",
    authLimiter,
    validateLogin,
    handleValidationErrors,
    login
);

router.post(
    "/refresh",
    authLimiter,
    validateRefreshToken,
    handleValidationErrors,
    refreshToken
);

// Protected routes (require authentication)
// Registration now requires authentication (admin or super_admin only)
router.post(
    "/register",
    generalLimiter,
    authenticateToken,
    adminOrSuperAdmin,
    validateRegistration,
    handleValidationErrors,
    register
);

router.get("/profile", generalLimiter, authenticateToken, getProfile);

router.put(
    "/profile",
    generalLimiter,
    authenticateToken,
    validateProfileUpdate,
    handleValidationErrors,
    updateProfile
);

router.post("/logout", generalLimiter, authenticateToken, logout);

module.exports = router;
