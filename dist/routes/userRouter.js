"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const userRouter = express_1.default.Router();
userRouter.post('/signup', userController_1.userSignup);
userRouter.post('/signin', userController_1.userLogin);
userRouter.post('/refreshToken', authMiddleware_1.authenticateUser, userController_1.refreshToken);
userRouter.put('/updatePassword', authMiddleware_1.authenticateUser, userController_1.updatePassword);
userRouter.put('/forgotPassword', userController_1.forgotPassword);
userRouter.post('/verifyOtp', userController_1.verifyOtp);
userRouter.put('/resetPassword', userController_1.resetPassword);
userRouter.get('/getUser/:userId', authMiddleware_1.authenticateUser, userController_1.getUser);
userRouter.get('/getAllUser', userController_1.getAllUsers);
userRouter.post('/logout', authMiddleware_1.authenticateUser, userController_1.logout);
exports.default = userRouter;
//# sourceMappingURL=userRouter.js.map