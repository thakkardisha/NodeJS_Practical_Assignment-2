const express = require("express");

const adminMiddleware = require("./middleware/adminMiddleware");

const app = express();


// Demo login middleware
// In a real application, req.user would come from JWT authentication.
const loginMiddleware = (req, res, next) => {

    // Change this to "customer" to test the 403 response
    req.user = {
        userId: "12345",
        name: "Admin User",
        role: "admin"
    };

    next();
};


// Admin-only inventory route
app.get(
    "/api/admin/inventory",
    loginMiddleware,
    adminMiddleware,
    (req, res) => {

        res.status(200).json({
            success: true,
            message: "Inventory data accessed successfully",
            inventory: [
                {
                    book: "Atrapi",
                    stock: 70,
                    sales: 57
                },
                {
                    book: "Satyabhama",
                    stock: 10,
                    sales: 8
                }
            ]
        });
    }
);


app.listen(3004, () => {
    console.log("Server running at http://localhost:3004");
});