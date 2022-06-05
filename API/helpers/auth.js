const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header("x-auth-token");

    if (!token) {
        return res.status(401).json({ msg: "No Token, authorization denied!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded.user;

        next();
    } catch (error) {
        return res.status(401).json({ msg: "Token Invalid!" });
    }
};
