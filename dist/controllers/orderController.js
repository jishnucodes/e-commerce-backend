"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatusController = exports.cancelOrderController = exports.updateOrderController = exports.getAOrderController = exports.getOrdersController = exports.createOrderController = void 0;
const orderService_1 = require("../service/orderService");
const createOrderController = async (req, res) => {
    const { user } = req;
    const { id: userId, role } = user;
    try {
        const order = await (0, orderService_1.createOrder)({ ...req.body, userId, role });
        return res
            .status(201)
            .json({
            status: "success",
            message: "Order created successfully",
            data: order,
        });
    }
    catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return res
            .status(500)
            .json({
            status: "error",
            message: "Internal server error",
            error: errorMessage,
        });
    }
};
exports.createOrderController = createOrderController;
const getOrdersController = async (req, res) => {
    try {
        const { page = "1", limit = "20", search = "", sortBy = "createdAt", order = "desc", status = "ACTIVE", } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { slug: { contains: search, mode: "insensitive" } },
                ],
            }),
            ...(status && { status }),
        };
        const inputData = {
            skip,
            take,
            where,
            sortBy,
            order,
        };
        const { orders, total } = await (0, orderService_1.getOrders)({
            ...inputData,
            order: order === "asc" ? "asc" : "desc",
        });
        return res.status(200).json({
            status: true,
            message: "Orders fetched successfully",
            data: {
                total,
                page: Number(page),
                limit: Number(limit),
                orders,
            },
        });
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({
            status: false,
            message: "Failed to fetch orders",
        });
    }
};
exports.getOrdersController = getOrdersController;
const getAOrderController = async (req, res) => {
    try {
        const { user } = req;
        const { id: userId, role } = user;
        if (role !== "ADMIN")
            return res
                .status(403)
                .json({ status: false, message: "User is not admin" });
        const orderId = Number(req.params.orderId);
        if (Number.isNaN(orderId)) {
            return res.status(400).json({
                status: false,
                message: "Order ID must be a valid number",
            });
        }
        const order = await (0, orderService_1.getOrderById)(orderId);
        return res.status(200).json({
            status: true,
            message: "Order details fetched successfully",
            data: { order },
        });
    }
    catch (error) {
        console.error("Error fetching order:", error);
        return res.status(500).json({
            status: false,
            message: "Failed to fetch order",
        });
    }
};
exports.getAOrderController = getAOrderController;
const updateOrderController = async (req, res) => {
    try {
        const { user } = req;
        const { id: userId, role } = user;
        if (role !== "ADMIN")
            return res
                .status(403)
                .json({ status: false, message: "User is not admin" });
        const orderId = Number(req.params.orderId);
        if (Number.isNaN(orderId)) {
            return res.status(400).json({
                status: false,
                message: "Order ID must be a valid number",
            });
        }
        const updateAOrder = await (0, orderService_1.updateOrder)({ ...req.body, userId, role });
        return res
            .status(201)
            .json({
            status: "success",
            message: "Order updated successfully",
            data: updateAOrder,
        });
    }
    catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return res
            .status(500)
            .json({
            status: "error",
            message: "Internal server error",
            error: errorMessage,
        });
    }
};
exports.updateOrderController = updateOrderController;
const cancelOrderController = async (req, res) => {
    try {
        const { user } = req;
        const { id: userId, role } = user;
        if (role !== "ADMIN")
            return res
                .status(403)
                .json({ status: false, message: "User is not admin" });
        const orderId = Number(req.params.orderId);
        if (Number.isNaN(orderId)) {
            return res.status(400).json({
                status: false,
                message: "Order ID must be a valid number",
            });
        }
        const cancelAOrder = await (0, orderService_1.cancelOrder)({ ...req.body, userId, role });
        return res
            .status(201)
            .json({
            status: "success",
            message: "Order cancelled successfully",
            data: cancelAOrder,
        });
    }
    catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return res
            .status(500)
            .json({
            status: "error",
            message: "Internal server error",
            error: errorMessage,
        });
    }
};
exports.cancelOrderController = cancelOrderController;
const updateOrderStatusController = async (req, res) => {
    try {
        const { user } = req;
        const { id: userId, role } = user;
        if (role !== "ADMIN")
            return res
                .status(403)
                .json({ status: false, message: "User is not admin" });
        const orderId = Number(req.params.orderId);
        if (Number.isNaN(orderId)) {
            return res.status(400).json({
                status: false,
                message: "Order ID must be a valid number",
            });
        }
        const updateAOrder = await (0, orderService_1.updateOrderStatus)({ ...req.body, userId, role });
        return res
            .status(201)
            .json({
            status: "success",
            message: "Order status updated successfully",
            data: updateAOrder,
        });
    }
    catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return res
            .status(500)
            .json({
            status: "error",
            message: "Internal server error",
            error: errorMessage,
        });
    }
};
exports.updateOrderStatusController = updateOrderStatusController;
//# sourceMappingURL=orderController.js.map