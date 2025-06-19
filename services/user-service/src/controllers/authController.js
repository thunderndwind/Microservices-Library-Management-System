const User = require("../models/User");
const { generateTokens, verifyRefreshToken } = require("../config/jwt");
const eventService = require("../services/eventService");

// Register a new user
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            phone,
        });

        await user.save();

        // Generate tokens
        const tokens = generateTokens({ userId: user._id });

        // Store refresh token
        user.refreshTokens.push({
            token: tokens.refreshToken,
        });
        await user.save();

        // Publish event
        await eventService.publishUserRegistered(user);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: user.toJSON(),
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

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findByEmailWithPassword(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check if user is active
        if (user.status !== "active") {
            return res.status(401).json({
                success: false,
                message: "Account is suspended or inactive",
            });
        }

        // Generate tokens
        const tokens = generateTokens({ userId: user._id });

        // Store refresh token
        user.refreshTokens.push({
            token: tokens.refreshToken,
        });
        await user.save();

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: user.toJSON(),
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

// Get user profile
const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Profile retrieved successfully",
            data: {
                user: req.user.toJSON(),
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

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone) updateData.phone = phone;

        const user = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });

        // Publish event
        await eventService.publishUserProfileUpdated(user);

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                user: user.toJSON(),
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

        // Find user and check if refresh token exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        const tokenExists = user.refreshTokens.some(
            (tokenObj) => tokenObj.token === refreshToken
        );

        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        // Check if user is active
        if (user.status !== "active") {
            return res.status(401).json({
                success: false,
                message: "Account is suspended or inactive",
            });
        }

        // Generate new tokens
        const tokens = generateTokens({ userId: user._id });

        // Remove old refresh token and add new one
        user.refreshTokens = user.refreshTokens.filter(
            (tokenObj) => tokenObj.token !== refreshToken
        );
        user.refreshTokens.push({
            token: tokens.refreshToken,
        });
        await user.save();

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

// Logout user
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user._id;

        if (refreshToken) {
            // Remove specific refresh token
            await User.findByIdAndUpdate(userId, {
                $pull: { refreshTokens: { token: refreshToken } },
            });
        } else {
            // Remove all refresh tokens (logout from all devices)
            await User.findByIdAndUpdate(userId, {
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
