const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticateToken } = require("../middleware/auth");
const { getMemberById, healthCheck } = require("../controllers/userController");

const router = express.Router();

// Rate limiting for user routes
const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Health check endpoint (public)
router.get("/health", healthCheck);

// Protected routes
router.get("/:id", userLimiter, authenticateToken, getMemberById);

module.exports = router;
