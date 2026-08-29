const authMiddleware = (req, res, next) => {

    req.user = {
        userId: "customer123",
        role: "customer"
    };

    next();
};

module.exports = authMiddleware;