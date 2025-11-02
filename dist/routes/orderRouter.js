"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const orderController_1 = require("../controllers/orderController");
const orderRouter = express_1.default.Router();
orderRouter.post("/create", authMiddleware_1.authenticateUser, orderController_1.createOrderController);
orderRouter.get("/list", authMiddleware_1.authenticateUser, orderController_1.getOrdersController);
orderRouter.get("/:orderId", authMiddleware_1.authenticateUser, orderController_1.getAOrderController);
orderRouter.put("/:orderId", authMiddleware_1.authenticateUser, orderController_1.updateOrderController);
orderRouter.put("/:orderId/cancel", authMiddleware_1.authenticateUser, orderController_1.cancelOrderController);
orderRouter.put("/:orderId/status", authMiddleware_1.authenticateUser, orderController_1.updateOrderStatusController);
exports.default = orderRouter;
//# sourceMappingURL=orderRouter.js.map