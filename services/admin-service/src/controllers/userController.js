const eventService = require("../services/eventService");
const axios = require("axios"); // We'll need to install this

// Note: This controller communicates with the User Service
const USER_SERVICE_URL =
    process.env.USER_SERVICE_URL || "http://localhost:3001";

// Get all library members
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;

        // Make API call to User Service
        const response = await axios.get(
            `${USER_SERVICE_URL}/api/v1/internal/users`,
            {
                params: { page, limit, search },
                headers: {
                    "X-Service-Token":
                        process.env.SERVICE_TOKEN || "internal-service-token",
                },
            }
        );

        res.json({
            success: true,
            message: "Users retrieved successfully",
            data: response.data.data,
        });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve users",
        });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Make API call to User Service
        const response = await axios.get(
            `${USER_SERVICE_URL}/api/v1/internal/users/${id}`,
            {
                headers: {
                    "X-Service-Token":
                        process.env.SERVICE_TOKEN || "internal-service-token",
                },
            }
        );

        res.json({
            success: true,
            message: "User retrieved successfully",
            data: response.data.data,
        });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve user",
        });
    }
};

// Update user status (suspend/activate)
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        // Make API call to User Service
        const response = await axios.put(
            `${USER_SERVICE_URL}/api/v1/internal/users/${id}/status`,
            { status, reason },
            {
                headers: {
                    "X-Service-Token":
                        process.env.SERVICE_TOKEN || "internal-service-token",
                },
            }
        );

        // Publish event if user was suspended
        if (status === "suspended") {
            await eventService.publishUserSuspended(
                id,
                req.admin._id.toString(),
                reason
            );
        }

        res.json({
            success: true,
            message: "User status updated successfully",
            data: response.data.data,
        });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        console.error("Update user status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user status",
        });
    }
};

// Delete user account
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Make API call to User Service
        await axios.delete(`${USER_SERVICE_URL}/api/v1/internal/users/${id}`, {
            headers: {
                "X-Service-Token":
                    process.env.SERVICE_TOKEN || "internal-service-token",
            },
        });

        res.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
};
