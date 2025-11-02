"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const couponController_1 = require("../controllers/couponController");
const couponRouter = express_1.default.Router();
couponRouter.get('/list', authMiddleware_1.authenticateUser, couponController_1.getCoupons);
couponRouter.get('/:couponId', authMiddleware_1.authenticateUser, couponController_1.getCouponById);
couponRouter.post('/create', authMiddleware_1.authenticateUser, couponController_1.createCoupon);
couponRouter.put('/:couponId', authMiddleware_1.authenticateUser, couponController_1.updateCoupon);
couponRouter.delete('/:couponId', authMiddleware_1.authenticateUser, couponController_1.deleteCoupon);
exports.default = couponRouter;
//# sourceMappingURL=couponRouter.js.map