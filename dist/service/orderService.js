"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReturnRequest = exports.handlePaymentSuccess = exports.updateOrderStatus = exports.cancelOrder = exports.updateOrder = exports.getOrderById = exports.getOrders = exports.createOrder = void 0;
const library_1 = require("@prisma/client/runtime/library");
const prisma_1 = require("../lib/prisma");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PROCESSING"] = "PROCESSING";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["RETURNED"] = "RETURNED";
})(OrderStatus || (OrderStatus = {}));
const createOrder = async (data) => {
    if (data.role !== "ADMIN") {
        throw new Error("User is not admin");
    }
    const dbUser = await prisma_1.db.user.findUnique({ where: { id: data.userId } });
    if (!dbUser)
        throw new Error("User not found");
    return await prisma_1.db.$transaction(async (tx) => {
        var _a;
        const variants = await tx.productVariant.findMany({
            where: {
                id: {
                    in: data.items.map((item) => item.productVariantId),
                },
            },
        });
        if (variants.length !== data.items.length) {
            throw new Error("Some product variants not found");
        }
        let subtotal = new library_1.Decimal(0);
        const orderItems = data.items.map((item) => {
            const variant = variants.find((v) => v.id === item.productVariantId);
            if (!variant) {
                throw new Error(`Product variant with id ${item.productVariantId} not found`);
            }
            const price = new library_1.Decimal(variant.price || 0);
            subtotal = subtotal.plus(price.mul(item.quantity));
            return {
                productVariantId: item.productVariantId,
                quantity: item.quantity,
                price,
                discountAmount: new library_1.Decimal(0),
            };
        });
        const shippingCost = new library_1.Decimal(10);
        const taxAmount = subtotal.mul(0.1);
        const totalAmount = subtotal.plus(shippingCost).plus(taxAmount);
        const order = await tx.order.create({
            data: {
                userId: data.userId,
                shippingAddressId: data.shippingAddressId,
                billingAddressId: data.billingAddressId,
                shippingMethodId: data.shippingMethodId,
                discountCode: data.discountCode,
                isGift: (_a = data.isGift) !== null && _a !== void 0 ? _a : false,
                giftMessage: data.giftMessage,
                notes: data.notes,
                totalAmount,
                shippingCost,
                taxAmount,
                orderItems: {
                    create: orderItems,
                },
                payment: {
                    create: {
                        method: "stripe",
                        status: "PENDING",
                    },
                },
            },
            include: {
                orderItems: true,
                payment: true,
            },
        });
        return order;
    });
};
exports.createOrder = createOrder;
const getOrders = async ({ skip, take, where, sortBy, order, }) => {
    const [orders, total] = await Promise.all([
        prisma_1.db.order.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: order },
            select: {
                id: true,
                userId: true,
                paymentMethod: true,
                paymentStatus: true,
                orderStatus: true,
                orderedDate: true,
                trackingNumber: true,
                deliveryDate: true,
                totalAmount: true,
                shippingCost: true,
                taxAmount: true,
                discountCode: true,
                cancellationReason: true,
                refundStatus: true,
                createdAt: true,
                updatedAt: true,
                user: { select: { id: true, userName: true } },
            },
        }),
        prisma_1.db.order.count({ where }),
    ]);
    return { orders, total };
};
exports.getOrders = getOrders;
const getOrderById = async (orderId) => {
    const order = await prisma_1.db.order.findUnique({
        where: { id: orderId },
        include: {
            orderItems: true,
            shippingAddress: true,
            billingAddress: true,
            shippingMethod: true,
            payment: true,
        },
    });
    return order;
};
exports.getOrderById = getOrderById;
const updateOrder = async (data) => {
    const { id, shippingAddressId, billingAddressId, notes } = data;
    const updatedOrder = await prisma_1.db.order.update({
        where: { id },
        data: { shippingAddressId, billingAddressId, notes },
    });
    return updatedOrder;
};
exports.updateOrder = updateOrder;
const cancelOrder = async (data) => {
    const { id, orderStatus, cancellationReason } = data;
    const order = await prisma_1.db.order.update({
        where: { id },
        data: {
            orderStatus: orderStatus || "CANCELLED",
            cancellationReason: cancellationReason || "User requested cancellation",
        },
    });
    return order;
};
exports.cancelOrder = cancelOrder;
const updateOrderStatus = async (data) => {
    const { id, orderStatus, trackingNumber, deliveryDate } = data;
    const updated = await prisma_1.db.order.update({
        where: { id },
        data: {
            orderStatus,
            trackingNumber,
            deliveryDate,
        },
    });
    return updated;
};
exports.updateOrderStatus = updateOrderStatus;
const handlePaymentSuccess = async (orderId, transactionId) => {
    return await prisma_1.db.$transaction(async (tx) => {
        const order = await tx.order.update({
            where: {
                id: orderId,
            },
            data: {
                paymentStatus: "PAID",
                orderStatus: "CONFIRMED",
            },
        });
        await tx.payment.update({
            where: {
                orderId,
            },
            data: {
                status: "PAID",
                transactionId,
                paidAt: new Date(),
            },
        });
        await tx.invoice.create({
            data: {
                orderId,
                invoiceNo: `INV-${Date.now()}`,
            },
        });
        return order;
    });
};
exports.handlePaymentSuccess = handlePaymentSuccess;
const handleReturnRequest = async (orderId, reason) => {
    return await prisma_1.db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: {
                id: orderId,
            },
        });
        if (!order)
            throw new Error("Order not found");
        if (order.paymentStatus !== "PAID") {
            throw new Error("Only paid orders can be returned");
        }
        const returnRequest = await tx.return.create({
            data: {
                orderId,
                reason,
            },
        });
        await tx.order.update({
            where: {
                id: orderId,
            },
            data: {
                refundStatus: "REQUESTED",
            },
        });
        return returnRequest;
    });
};
exports.handleReturnRequest = handleReturnRequest;
//# sourceMappingURL=orderService.js.map