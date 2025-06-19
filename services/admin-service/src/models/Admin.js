const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
            select: false, // Don't include password in queries by default
        },
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            maxlength: [50, "First name cannot exceed 50 characters"],
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"],
        },
        phone: {
            type: String,
            trim: true,
            match: [
                /^[\+]?[1-9][\d]{0,15}$/,
                "Please enter a valid phone number",
            ],
        },
        role: {
            type: String,
            enum: ["super_admin", "admin", "librarian"],
            required: [true, "Role is required"],
            default: "librarian",
        },
        permissions: [
            {
                type: String,
                enum: [
                    "manage_books",
                    "manage_users",
                    "manage_reservations",
                    "view_reports",
                    "manage_admins",
                    "manage_super_admins",
                    "system_config",
                ],
            },
        ],
        lastLogin: {
            type: Date,
        },
        refreshTokens: [
            {
                token: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                    expires: 86400, // 24 hours in seconds (shorter for admins)
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });

// Set default permissions based on role
adminSchema.pre("save", function (next) {
    if (this.isNew || this.isModified("role")) {
        if (this.role === "super_admin") {
            this.permissions = [
                "manage_books",
                "manage_users",
                "manage_reservations",
                "view_reports",
                "manage_admins",
                "manage_super_admins",
                "system_config",
            ];
        } else if (this.role === "admin") {
            this.permissions = [
                "manage_books",
                "manage_users",
                "manage_reservations",
                "view_reports",
                "manage_admins",
                "system_config",
            ];
        } else if (this.role === "librarian") {
            this.permissions = [
                "manage_books",
                "manage_users",
                "manage_reservations",
                "view_reports",
            ];
        }
    }
    next();
});

// Hash password before saving
adminSchema.pre("save", async function (next) {
    // Only hash if password is modified
    if (!this.isModified("password")) return next();

    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get admin without sensitive info
adminSchema.methods.toJSON = function () {
    const adminObject = this.toObject();
    delete adminObject.password;
    delete adminObject.refreshTokens;
    return adminObject;
};

// Static method to find by email (including password for authentication)
adminSchema.statics.findByEmailWithPassword = function (email) {
    return this.findOne({ email }).select("+password");
};

// Instance method to check permission
adminSchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission);
};

// Instance method to update last login
adminSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
};

// Virtual for full name
adminSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Admin", adminSchema);
