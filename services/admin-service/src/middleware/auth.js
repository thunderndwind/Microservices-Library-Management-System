const { verifyAccessToken } = require("../config/jwt");
const Admin = require("../models/Admin");

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

        // Find the admin
        const admin = await Admin.findById(decoded.userId);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin not found",
            });
        }

        // Add admin to request object
        req.admin = admin;
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

// Permission check middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!req.admin.hasPermission(permission)) {
            return res.status(403).json({
                success: false,
                message: `Permission '${permission}' required`,
            });
        }

        next();
    };
};

// Role check middleware
const requireRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!allowedRoles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${allowedRoles.join(" or ")}' required`,
            });
        }

        next();
    };
};

// Admin only middleware
const adminOnly = requireRole("admin");

// Super Admin only middleware
const superAdminOnly = requireRole("super_admin");

// Admin or Super Admin middleware
const adminOrSuperAdmin = requireRole(["super_admin", "admin"]);

module.exports = {
    authenticateToken,
    requirePermission,
    requireRole,
    adminOnly,
    superAdminOnly,
    adminOrSuperAdmin,
};
