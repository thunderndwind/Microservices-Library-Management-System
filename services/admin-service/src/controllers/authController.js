const Admin = require("../models/Admin");
const { generateTokens, verifyRefreshToken } = require("../config/jwt");
const eventService = require("../services/eventService");

// Register a new admin/librarian (only for authenticated super_admin/admin)
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, role } = req.body;
        const currentAdmin = req.admin; // This will be set by authentication middleware

        // Validate role creation permissions
        if (role === "super_admin" && currentAdmin.role !== "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Only super admin can create super admin accounts",
            });
        }

        if (role === "admin" && currentAdmin.role !== "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Only super admin can create admin accounts",
            });
        }

        if (role === "admin" && currentAdmin.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin can only create librarian accounts",
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Admin with this email already exists",
            });
        }

        // Create new admin
        const admin = new Admin({
            email,
            password,
            firstName,
            lastName,
            phone,
            role: role || "librarian", // Default to librarian
        });

        await admin.save();

        // Generate tokens
        const tokens = generateTokens({ userId: admin._id });

        // Store refresh token
        admin.refreshTokens.push({
            token: tokens.refreshToken,
        });
        await admin.save();

        // Publish event
        await eventService.publishAdminRegistered(admin, currentAdmin);

        res.status(201).json({
            success: true,
            message: `${role || "Librarian"} registered successfully`,
            data: {
                admin: admin.toJSON(),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Login admin/librarian
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin with password
        const admin = await Admin.findByEmailWithPassword(email);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate tokens
        const tokens = generateTokens({ userId: admin._id });

        // Store refresh token
        admin.refreshTokens.push({
            token: tokens.refreshToken,
        });

        // Update last login
        await admin.updateLastLogin();
        await admin.save();

        // Publish login event
        await eventService.publishAdminLogin(admin);

        res.json({
            success: true,
            message: "Login successful",
            data: {
                admin: admin.toJSON(),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get admin profile
const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Profile retrieved successfully",
            data: {
                admin: req.admin.toJSON(),
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Update admin profile
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const adminId = req.admin._id;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone) updateData.phone = phone;

        const admin = await Admin.findByIdAndUpdate(adminId, updateData, {
            new: true,
            runValidators: true,
        });

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                admin: admin.toJSON(),
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Refresh JWT token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Find admin and check if refresh token exists
        const admin = await Admin.findById(decoded.userId);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin not found",
            });
        }

        const tokenExists = admin.refreshTokens.some(
            (tokenObj) => tokenObj.token === refreshToken
        );

        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        // Generate new tokens
        const tokens = generateTokens({ userId: admin._id });

        // Remove old refresh token and add new one
        admin.refreshTokens = admin.refreshTokens.filter(
            (tokenObj) => tokenObj.token !== refreshToken
        );
        admin.refreshTokens.push({
            token: tokens.refreshToken,
        });
        await admin.save();

        res.json({
            success: true,
            message: "Tokens refreshed successfully",
            data: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
            });
        }

        console.error("Refresh token error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Logout admin
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const adminId = req.admin._id;

        if (refreshToken) {
            // Remove specific refresh token
            await Admin.findByIdAndUpdate(adminId, {
                $pull: { refreshTokens: { token: refreshToken } },
            });
        } else {
            // Remove all refresh tokens (logout from all devices)
            await Admin.findByIdAndUpdate(adminId, {
                $set: { refreshTokens: [] },
            });
        }

        res.json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    refreshToken,
    logout,
};
