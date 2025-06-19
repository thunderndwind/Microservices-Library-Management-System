const { verifyAccessToken } = require("../config/jwt");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is required",
            });
        }

        // Verify the token
        const decoded = verifyAccessToken(token);

        // Find the user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if user is active
        if (user.status !== "active") {
            return res.status(401).json({
                success: false,
                message: "Account is suspended or inactive",
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired",
            });
        }

        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId);

        if (user && user.status === "active") {
            req.user = user;
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without user
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
};
