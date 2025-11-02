"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authenticateUser = (req, res, next) => {
    const { accessToken, refreshToken } = req.cookies;
    let token;
    if (!accessToken) {
        token = refreshToken;
    }
    else {
        token = accessToken;
    }
    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "Not authenticated. Token missing.",
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        // Attach the user to the request object using a type assertion
        req.user = decoded.data;
        next();
    }
    catch (err) {
        console.error("Token verification failed:", err);
        return res.status(403).json({
            status: "error",
            message: "Invalid or expired token",
        });
    }
};
exports.authenticateUser = authenticateUser;
