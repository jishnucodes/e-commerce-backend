"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.getUser = exports.resetPassword = exports.verifyOtp = exports.forgotPassword = exports.updatePassword = exports.logout = exports.refreshToken = exports.userLogin = exports.userSignup = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const utils_1 = __importDefault(require("../utils/utils"));
const inngest_1 = require("../inngest");
const generateOtp_1 = require("../utils/generateOtp");
const userSignup = async (req, res) => {
    const { userName, email, password } = req.body;
    try {
        const existingUser = await prisma_1.db.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({
                status: false,
                message: "User already exists",
            });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const newUser = await prisma_1.db.user.create({
            data: {
                userName,
                email,
                hashedPassword,
                userType: "USER", // Default user type
                role: "USER", // Default role
            },
        });
        return res.status(201).json({
            status: true,
            message: "User created successfully",
            data: {
                id: newUser.id,
                userName: newUser.userName,
                email: newUser.email,
            },
        });
    }
    catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.userSignup = userSignup;
// export const userLogin = async (req: Request, res: Response) => {
//   const { email, password } = req.body;
//   try {
//     const user = await db.user.findUnique({ where: { email } });
//     if (!user) {
//       return res.status(400).json({
//         status: "error",
//         message: "User not found",
//       });
//     }
//     const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
//     if (!isPasswordValid) {
//       return res.status(400).json({
//         status: "error",
//         message: "Invalid password",
//       });
//     }
//     const otp = generateOtp()
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
//     await db.otpToken.create({ data: { email, token: otp, expiresAt } });
//    await inngest.send({
//     name: "user/otp-requested",
//     data: { name: user.userName, email, otp },
//   });
//   return res.status(200).json({ message: "OTP sent to email" });
//   } catch (error) {
//     console.error("Login error:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Something went wrong",
//     });
//   }
// }
const userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma_1.db.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "User not found",
            });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.hashedPassword);
        if (!isPasswordValid) {
            return res.status(400).json({
                status: false,
                message: "Invalid password",
            });
        }
        await inngest_1.inngest.send({
            name: "user/signed-in",
            data: {
                email: user.email,
                name: user.userName,
                signInTime: new Date().toISOString(),
            },
        });
        //short lived access token
        const accessToken = (0, utils_1.default)({ id: user.id, role: user.role }, "15m");
        //short lived refresh token
        const refreshToken = (0, utils_1.default)({ id: user.id, role: user.role }, "7d");
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // only over HTTPS in production
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 2 minutes in ms
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
            status: true,
            message: "Login successful",
            data: {
                id: user.id,
                userName: user.userName,
                email: user.email,
                userType: user.userType,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
        });
    }
};
exports.userLogin = userLogin;
const refreshToken = async (req, res) => {
    const { user } = req;
    try {
        const newAccessToken = (0, utils_1.default)(user, "15m");
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 2 * 60 * 1000,
        });
        res.json({ status: true, message: "Access token refreshed" });
    }
    catch (err) {
        return res.status(401).json({ status: false, message: "Invalid refresh token" });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({
        status: true,
        message: "Logged out",
    });
};
exports.logout = logout;
const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { user } = req;
    const { id, role } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const isPasswordCorrect = await bcrypt_1.default.compare(currentPassword, user.hashedPassword);
        if (!isPasswordCorrect) {
            return res
                .status(400)
                .json({ status: false, message: "Current password is incorrect" });
        }
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 10);
        await prisma_1.db.user.update({
            where: { id: id },
            data: { hashedPassword: hashedNewPassword },
        });
        return res
            .status(200)
            .json({ status: true, message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Update password error:", error);
        return res
            .status(500)
            .json({ status: false, message: "Internal server error" });
    }
};
exports.updatePassword = updatePassword;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma_1.db.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "user not found",
            });
        }
        const otp = (0, generateOtp_1.generateOtp)();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await prisma_1.db.otpToken.create({ data: { email, token: otp, expiresAt } });
        await inngest_1.inngest.send({
            name: "user/otp-requested",
            data: { name: user.userName, email, otp },
        });
        return res.status(200).json({ status: true, message: "OTP sent to email" });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            message: "internal server error",
        });
    }
};
exports.forgotPassword = forgotPassword;
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const record = await prisma_1.db.otpToken.findFirst({
            where: {
                email,
                token: otp,
                expiresAt: { gt: new Date() },
            },
        });
        if (!record) {
            return res
                .status(401)
                .json({ status: false, message: "Invalid or expired OTP" });
        }
        const user = await prisma_1.db.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        await prisma_1.db.otpToken.delete({ where: { id: record.id } });
        return res
            .status(200)
            .json({ status: true, message: "OTP verified successfully" });
    }
    catch (error) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
        });
    }
};
exports.verifyOtp = verifyOtp;
const resetPassword = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma_1.db.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "user not found",
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await prisma_1.db.user.update({
            where: { id: user.id },
            data: { hashedPassword },
        });
        return res.status(200).json({
            status: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        console.error("Password reset error:", error);
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
        });
    }
};
exports.resetPassword = resetPassword;
const getUser = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    console.log("Role:", role);
    const userId = req.params.userId ? parseInt(req.params.userId) : id;
    if (!userId) {
        return res.status(401).json({
            status: false,
            message: "Unauthorized",
        });
    }
    try {
        const user = await prisma_1.db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userName: true,
                email: true,
                userType: true,
                role: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found",
            });
        }
        return res.status(200).json({
            status: true,
            user,
        });
    }
    catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.getUser = getUser;
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.db.user.findMany({
            select: {
                id: true,
                userName: true,
                email: true,
                userType: true,
                role: true,
            },
        });
        return res.status(200).json({
            status: true,
            message: "Users retrieved successfully",
            users,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.getAllUsers = getAllUsers;
