"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const secret_key = process.env.SECRET_KEY;
const generateToken = (user, expiresIn) => {
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign({ data: user }, secret_key, options);
};
exports.default = generateToken;
