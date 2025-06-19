const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
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
            minlength: [6, "Password must be at least 6 characters long"],
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
        status: {
            type: String,
            enum: ["active", "suspended", "inactive"],
            default: "active",
        },
        membershipDate: {
            type: Date,
            default: Date.now,
        },
        refreshTokens: [
            {
                token: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                    expires: 604800, // 7 days in seconds
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user without sensitive info
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.refreshTokens;
    return userObject;
};

// Static method to find active users
userSchema.statics.findActive = function () {
    return this.find({ status: "active" });
};

// Static method to find by email (including password for authentication)
userSchema.statics.findByEmailWithPassword = function (email) {
    return this.findOne({ email }).select("+password");
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", userSchema);
