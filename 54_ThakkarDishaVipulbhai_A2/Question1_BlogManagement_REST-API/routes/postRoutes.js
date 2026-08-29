const express = require("express");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");

const Post = require("../models/Post");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();


// =====================================================
// EJS - PUBLIC PUBLISHED POSTS
// =====================================================

router.get("/view/all", async (req, res) => {
    try {
        const posts = await Post.find({
            published: true
        }).sort({ createdAt: -1 });

        res.render("posts", {
            posts
        });

    } catch (error) {
        res.status(500).send("Server error");
    }
});


// =====================================================
// EJS - PROTECTED DASHBOARD
// =====================================================

router.get(
    "/view/dashboard",
    authMiddleware,
    async (req, res) => {
        try {
            const posts = await Post.find({
                author: req.user.userId
            }).sort({ createdAt: -1 });

            const user = await User.findById(
                req.user.userId
            );

            if (!user) {
                return res.status(404).send("User not found");
            }

            res.render("dashboard", {
                user,
                posts
            });

        } catch (error) {
            res.status(500).send("Server error");
        }
    }
);


// =====================================================
// CREATE POST
// POST /api/posts
// =====================================================

router.post(
    "/",
    authMiddleware,

    [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required"),

        body("content")
            .trim()
            .notEmpty()
            .withMessage("Content is required"),

        body("tags")
            .optional()
            .isArray()
            .withMessage("Tags must be an array"),

        body("published")
            .optional()
            .isBoolean()
            .withMessage("Published must be true or false")
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

            const {
                title,
                content,
                tags,
                published
            } = req.body;

            const post = await Post.create({
                title,
                content,
                tags: tags || [],
                published: published || false,
                author: req.user.userId
            });

            res.status(201).json({
                success: true,
                message: "Post created successfully",
                post
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// =====================================================
// GET ALL MY POSTS
// GET /api/posts
// =====================================================

router.get(
    "/",
    authMiddleware,
    async (req, res) => {
        try {
            const posts = await Post.find({
                author: req.user.userId
            }).sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                posts
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// =====================================================
// GET SINGLE POST
// GET /api/posts/:id
// =====================================================

router.get(
    "/:id",
    authMiddleware,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            const isOwner =
                post.author.toString() === req.user.userId;

            const isAdmin =
                req.user.role === "admin";

            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to view this post"
                });
            }

            res.status(200).json({
                success: true,
                post
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// =====================================================
// UPDATE POST
// PUT /api/posts/:id
// =====================================================

router.put(
    "/:id",
    authMiddleware,

    [
        body("title")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Title cannot be empty"),

        body("content")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Content cannot be empty"),

        body("tags")
            .optional()
            .isArray()
            .withMessage("Tags must be an array"),

        body("published")
            .optional()
            .isBoolean()
            .withMessage("Published must be true or false")
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

            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            const isOwner =
                post.author.toString() === req.user.userId;

            const isAdmin =
                req.user.role === "admin";

            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to update this post"
                });
            }

            const {
                title,
                content,
                tags,
                published
            } = req.body;

            if (title !== undefined) {
                post.title = title;
            }

            if (content !== undefined) {
                post.content = content;
            }

            if (tags !== undefined) {
                post.tags = tags;
            }

            if (published !== undefined) {
                post.published = published;
            }

            await post.save();

            res.status(200).json({
                success: true,
                message: "Post updated successfully",
                post
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// =====================================================
// DELETE POST
// DELETE /api/posts/:id
// =====================================================

router.delete(
    "/:id",
    authMiddleware,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            const isOwner =
                post.author.toString() === req.user.userId;

            const isAdmin =
                req.user.role === "admin";

            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to delete this post"
                });
            }

            // Delete associated image
            if (post.featuredImage) {
                const imagePath = path.join(
                    __dirname,
                    "..",
                    post.featuredImage
                );

                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await Post.findByIdAndDelete(req.params.id);

            res.status(200).json({
                success: true,
                message: "Post deleted successfully"
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// =====================================================
// IMAGE UPLOAD / REPLACE
// POST /api/posts/:id/image
// =====================================================

router.post(
    "/:id/image",
    authMiddleware,
    upload.single("image"),

    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                // Delete newly uploaded file if post doesn't exist
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(404).json({
                    success: false,
                    message: "Post not found"
                });
            }

            const isOwner =
                post.author.toString() === req.user.userId;

            const isAdmin =
                req.user.role === "admin";

            if (!isOwner && !isAdmin) {

                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to upload an image for this post"
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload an image"
                });
            }

            // Delete old image
            if (post.featuredImage) {
                const oldImagePath = path.join(
                    __dirname,
                    "..",
                    post.featuredImage
                );

                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Save new image path
            post.featuredImage =
                "/uploads/" + req.file.filename;

            await post.save();

            res.status(200).json({
                success: true,
                message: "Featured image uploaded successfully",
                image: post.featuredImage,
                post
            });

        } catch (error) {

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


module.exports = router;