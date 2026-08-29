const mongoose = require("mongoose");
const User = require("./models/User");
mongoose.connect("mongodb://127.0.0.1:27017/bookstoreDB")
    .then(async () => {
        console.log("MongoDB connected successfully");
        const user = await User.create({
            name: "Disha",
            email: "disha@gmail.com"
        });

        console.log("User created successfully:");
        console.log(user);

        console.log("Role:", user.role);

        mongoose.connection.close();
    })
    .catch((error) => {
        console.log("Error:", error.message);
    });