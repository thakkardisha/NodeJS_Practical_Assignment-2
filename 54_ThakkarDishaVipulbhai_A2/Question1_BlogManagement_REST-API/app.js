require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");

const app = express();

app.set("view engine", "ejs");

app.use(helmet());

app.use(
    cors({
        origin: process.env.TRUSTED_ORIGIN,
        credentials: true
    })
);

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(
    "/uploads",
    express.static("uploads")
);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 20,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use(
    "/api/auth/register",
    authLimiter
);

app.use(
    "/api/auth/login",
    authLimiter
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/posts",
    postRoutes
);
app.get("/", (req, res) => {
    res.send(`
        <h1>Blog Management REST API</h1>

        <p>
            <a href="/api/posts/view/all">
                View Published Posts
            </a>
        </p>

        <p>
            <a href="/api/auth/view/login">
                Login
            </a>
        </p>
    `);
});


// =====================================================
// MULTER / GENERAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {

    if (error.code === "LIMIT_FILE_SIZE") {

        return res.status(400).json({
            success: false,
            message: "File size must not exceed 2MB"
        });
    }

    if (
        error.message ===
        "Only JPEG, PNG and WebP images are allowed"
    ) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    res.status(500).json({
        success: false,
        message: "Server error"
    });
});


// =====================================================
// MONGODB
// =====================================================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );

        app.listen(
            process.env.PORT || 3000,
            () => {

                console.log(
                    `Server running at http://localhost:${process.env.PORT || 3000}`
                );

            }
        );

    })
    .catch(error => {

        console.error(
            "MongoDB connection failed:",
            error.message
        );

    });