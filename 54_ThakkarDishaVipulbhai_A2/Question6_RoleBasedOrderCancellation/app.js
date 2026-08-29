const express = require("express");

const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(express.json());


// Demo orders
const orders = [
    {
        id: "order1",
        customerId: "customer123",
        book: "Satyabhama",
        status: "pending"
    },
    {
        id: "order2",
        customerId: "customer456",
        book: "Atrapi",
        status: "pending"
    },
    {
        id: "order3",
        customerId: "customer123",
        book: "Chokkas Khuna",
        status: "shipped"
    }
];


// DELETE /api/orders/:id
app.delete(
    "/api/orders/:id",
    authMiddleware,
    (req, res) => {

        const orderId = req.params.id;

        // Find the order
        const order = orders.find(
            order => order.id === orderId
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }


        // Check whether order has already shipped
        if (order.status === "shipped") {
            return res.status(400).json({
                success: false,
                message: "Order cannot be cancelled because it has already shipped"
            });
        }


        // Customer can cancel only their own order
        const isOwner =
            order.customerId === req.user.userId;

        // Admin can cancel any order
        const isAdmin =
            req.user.role === "admin";


        // Allow customer owner OR admin
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden. You can cancel only your own orders."
            });
        }


        // Cancel the order
        order.status = "cancelled";

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order: order
        });
    }
);


app.listen(3005, () => {
    console.log("Server running at http://localhost:3005");
});