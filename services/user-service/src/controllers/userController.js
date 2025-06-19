const User = require("../models/User");

// Get member by ID (self only)
const getMemberById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id.toString();

        // Users can only access their own data
        if (id !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only access your own profile.",
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            message: "User retrieved successfully",
            data: {
                user: user.toJSON(),
            },
        });
    } catch (error) {
        console.error("Get member error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Health check endpoint
const healthCheck = async (req, res) => {
    try {
        // Check database connection
        const userCount = await User.countDocuments();

        res.json({
            success: true,
            message: "User service is healthy",
            data: {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                totalUsers: userCount,
                memoryUsage: process.memoryUsage(),
            },
        });
    } catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({
            success: false,
            message: "Service unhealthy",
            error: error.message,
        });
    }
};

module.exports = {
    getMemberById,
    healthCheck,
};
