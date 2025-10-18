import express from 'express';

import { authenticateUser } from '../middleware/authMiddleware';
import { cancelOrderController, createOrderController, getAOrderController, getOrdersController, updateOrderController, updateOrderStatusController } from '../controllers/orderController';

const orderRouter = express.Router();

orderRouter.post("/create", authenticateUser, createOrderController)
orderRouter.get("/list", authenticateUser, getOrdersController)
orderRouter.get("/:orderId", authenticateUser, getAOrderController)
orderRouter.put("/:orderId", authenticateUser, updateOrderController)
orderRouter.put("/:orderId/cancel", authenticateUser, cancelOrderController)
orderRouter.put("/:orderId/status", authenticateUser, updateOrderStatusController)


export default orderRouter;