const Admin = require("../models/Admin");

// Get all admins/librarians
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({});

        res.json({
            success: true,
            message: "Admins retrieved successfully",
            data: {
                admins: admins.map((admin) => admin.toJSON()),
            },
        });
    } catch (error) {
        console.error("Get admins error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve admins",
        });
    }
};

// Update admin role
const updateAdminRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const currentAdmin = req.admin;

        // Don't allow changing own role
        if (id === currentAdmin._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Cannot change your own role",
            });
        }

        // Get the target admin to check current role
        const targetAdmin = await Admin.findById(id);
        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        // Role-based permission checks
        if (role === "super_admin" && currentAdmin.role !== "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Only super admin can assign super admin role",
            });
        }

        if (role === "admin" && currentAdmin.role !== "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Only super admin can assign admin role",
            });
        }

        // Admin can only change librarian roles to librarian
        if (
            currentAdmin.role === "admin" &&
            (targetAdmin.role !== "librarian" || role !== "librarian")
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Admin can only modify librarian accounts and assign librarian role",
            });
        }

        // Prevent demoting the last super admin
        if (targetAdmin.role === "super_admin" && role !== "super_admin") {
            const superAdminCount = await Admin.countDocuments({
                role: "super_admin",
            });
            if (superAdminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot demote the last super admin",
                });
            }
        }

        const admin = await Admin.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: "Admin role updated successfully",
            data: {
                admin: admin.toJSON(),
            },
        });
    } catch (error) {
        console.error("Update admin role error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update admin role",
        });
    }
};

// Health check endpoint
const healthCheck = async (req, res) => {
    try {
        // Check database connection
        const adminCount = await Admin.countDocuments();

        res.json({
            success: true,
            message: "Admin service is healthy",
            data: {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                totalAdmins: adminCount,
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
    getAllAdmins,
    updateAdminRole,
    healthCheck,
};
