const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/database");
const eventService = require("./services/eventService");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

const app = express();

// Connect to database
connectDB();

// Connect to RabbitMQ
eventService.connect();

// Security middleware
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:3002",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "User Service is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/members", userRoutes);

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Error:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => ({
            field: err.path,
            message: err.message,
        }));
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`,
        });
    }

    // JWT errors
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

    // Default error
    res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error",
    });
});

module.exports = app;
