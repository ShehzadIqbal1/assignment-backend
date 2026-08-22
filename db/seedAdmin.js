const bcrypt = require("bcryptjs");

const User = require("../models/User");
const ROLES = require("../constants/roles");

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

    if (!adminEmail) {
      throw new Error("DEFAULT_ADMIN_EMAIL is missing from .env");
    }

    if (!adminPassword) {
      throw new Error("DEFAULT_ADMIN_PASSWORD is missing from .env");
    }

    const existingAdmin = await User.findOne({
      email: adminEmail.toLowerCase(),
    });

    if (existingAdmin) {
      console.log(`Default admin already exists: ${existingAdmin.email}`);

      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await User.create({
      fullName: process.env.DEFAULT_ADMIN_NAME || "System Administrator",

      email: adminEmail.toLowerCase(),

      countryCode: process.env.DEFAULT_ADMIN_COUNTRY_CODE || "+1",

      phoneNumber: process.env.DEFAULT_ADMIN_PHONE || "0000000000",

      password: hashedPassword,

      role: ROLES.ADMIN,

      isActive: true,

      emailVerified: true,
    });

    console.log(`Default admin created: ${admin.email}`);

    return admin;
  } catch (error) {
    console.error("Default admin seed failed:", error.message);

    throw error;
  }
};

module.exports = seedAdmin;
