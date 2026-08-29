const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(express.json());


// LOGIN
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    // Demo customer credentials
    // In a real application, these would be checked from MongoDB.
    if (
        email !== "customer@gmail.com" ||
        password !== "password123"
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    // Create JWT token
    const token = jwt.sign(
        {
            userId: "customer123",
            email: email,
            role: "customer"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

    res.status(200).json({
        success: true,
        message: "Login successful",
        token: token
    });
});


// PROTECTED ROUTE
app.get("/api/orders", authMiddleware, (req, res) => {

    res.status(200).json({
        success: true,
        message: "Order history accessed successfully",
        user: req.user,
        orders: [
            {
                orderId: "ORD001",
                book: "Node.js Basics",
                quantity: 1
            }
        ]
    });

});


app.listen(3002, () => {
    console.log("Server running at http://localhost:3002");
});