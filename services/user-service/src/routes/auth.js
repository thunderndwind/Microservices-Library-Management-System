const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticateToken } = require("../middleware/auth");
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

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs for auth routes
    message: {
        success: false,
        message: "Too many authentication attempts, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes (with rate limiting)
router.post(
    "/register",
    authLimiter,
    validateRegistration,
    handleValidationErrors,
    register
);

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
