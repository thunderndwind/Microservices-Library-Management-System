#!/usr/bin/env node

/**
 * Script to create the first Super Admin account
 * Run this script once to bootstrap the system with a super admin
 *
 * Usage: node create-super-admin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./src/models/Admin");

const createSuperAdmin = async () => {
    try {
        // Connect to database
        await mongoose.connect(
            process.env.MONGODB_URI ||
                "mongodb://localhost:27017/library_admins",
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );

        console.log("Connected to MongoDB");

        // Check if any super admin already exists
        const existingSuperAdmin = await Admin.findOne({ role: "super_admin" });
        if (existingSuperAdmin) {
            console.log(
                "Super admin already exists:",
                existingSuperAdmin.email
            );
            process.exit(0);
        }

        // Get super admin details from environment or use defaults
        const superAdminData = {
            email: process.env.SUPER_ADMIN_EMAIL || "superadmin@library.com",
            password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",
            firstName: process.env.SUPER_ADMIN_FIRST_NAME || "Super",
            lastName: process.env.SUPER_ADMIN_LAST_NAME || "Admin",
            phone: process.env.SUPER_ADMIN_PHONE || "+1234567890",
            role: "super_admin",
        };

        // Check if admin with this email already exists
        const existingAdmin = await Admin.findOne({
            email: superAdminData.email,
        });
        if (existingAdmin) {
            console.error(
                `Admin with email ${superAdminData.email} already exists`
            );
            process.exit(1);
        }

        // Create super admin
        const superAdmin = new Admin(superAdminData);
        await superAdmin.save();

        console.log("✅ Super Admin created successfully!");
        console.log("📧 Email:", superAdmin.email);
        console.log("👤 Name:", superAdmin.firstName, superAdmin.lastName);
        console.log("🔑 Role:", superAdmin.role);
        console.log("📱 Phone:", superAdmin.phone);
        console.log(
            "\n⚠️  Please change the default password after first login!"
        );
    } catch (error) {
        console.error("❌ Error creating super admin:", error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed");
    }
};

// Run the script
createSuperAdmin();
