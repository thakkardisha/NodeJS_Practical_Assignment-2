const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Display login page
router.get("/view/login", (req, res) => {
    res.render("login");
});


// REGISTER
router.post(
    "/register",

    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Name is required"),

        body("email")
            .trim()
            .isEmail()
            .withMessage("Valid email is required")
            .normalizeEmail(),

        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters")
    ],

    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { name, email, password } = req.body;

            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                name,
                email,
                password: hashedPassword
            });

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// LOGIN
router.post(
    "/login",

    [
        body("email")
            .trim()
            .isEmail()
            .withMessage("Valid email is required")
            .normalizeEmail(),

        body("password")
            .notEmpty()
            .withMessage("Password is required")
    ],

    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const token = jwt.sign(
                {
                    userId: user._id.toString(),
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN || "1h"
                }
            );

            // Store token in browser cookie
            res.setHeader(
                "Set-Cookie",
                `token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=3600`
            );

            // If login came from EJS form
            if (req.is("application/x-www-form-urlencoded")) {
                return res.redirect("/api/posts/view/dashboard");
            }

            // Normal API response
            res.status(200).json({
                success: true,
                message: "Login successful",
                token
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// PROFILE
router.get(
    "/profile",
    authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findById(req.user.userId)
                .select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            res.status(200).json({
                success: true,
                user
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

module.exports = router;