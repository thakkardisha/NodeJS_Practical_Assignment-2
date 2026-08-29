const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(";");

        const tokenCookie = cookies.find(cookie =>
            cookie.trim().startsWith("token=")
        );

        if (tokenCookie) {
            token = tokenCookie.trim().substring(6);
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;