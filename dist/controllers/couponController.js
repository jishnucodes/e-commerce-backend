"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = exports.deleteCoupon = exports.updateCoupon = exports.getCouponById = exports.getCoupons = exports.createCoupon = void 0;
const prisma_1 = require("../lib/prisma");
const createCoupon = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const { code, type, value, minimumAmount, maximumDiscount, usageLimit, startDate, endDate, applicableToProducts, applicableToCategories, } = req.body;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role !== "ADMIN") {
        return res.status(403).json({ status: false, message: "Forbidden" });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const coupon = await prisma_1.db.coupon.create({
            data: {
                code,
                type,
                value,
                minimumAmount,
                maximumDiscount,
                usageLimit,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                applicableToProducts,
                applicableToCategories,
            },
        });
        return res.status(201).json({
            status: true,
            message: "Coupon created successfully",
            data: coupon,
        });
    }
    catch (error) {
        console.error("Error creating coupon", error);
        return res
            .status(500)
            .json({ status: false, message: "Internal server error" });
    }
};
exports.createCoupon = createCoupon;
const getCoupons = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const coupons = await prisma_1.db.coupon.findMany({});
        console.log("coupons", coupons);
        return res.status(200).json({
            status: true,
            message: "Coupons fetched successfully",
            data: coupons,
        });
    }
    catch (error) {
        console.error("Error in getting coupons", error);
        return res
            .status(500)
            .json({ status: false, message: "Internal server error" });
    }
};
exports.getCoupons = getCoupons;
const getCouponById = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    try {
        const couponId = parseInt(req.params.couponId);
        if (isNaN(couponId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid coupon ID",
            });
        }
        const coupon = await prisma_1.db.coupon.findUnique({
            where: { id: couponId },
            include: { orderCoupons: true },
        });
        if (!coupon)
            return res
                .status(404)
                .json({ status: false, message: "Coupon not found" });
        return res.status(200).json({
            status: true,
            message: "Coupon fetched successfully",
            data: coupon,
        });
    }
    catch (error) {
        console.error("Error in getting coupon", error);
        return res
            .status(500)
            .json({ status: false, message: "Internal server error" });
    }
};
exports.getCouponById = getCouponById;
const updateCoupon = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const data = req.body;
    const requestBody = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
    };
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role !== "ADMIN") {
        return res.status(403).json({ status: false, message: "Forbidden" });
    }
    const couponId = parseInt(req.params.couponId);
    if (isNaN(couponId)) {
        return res.status(400).json({
            status: false,
            message: "Invalid coupon ID",
        });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const coupon = await prisma_1.db.coupon.update({
            where: { id: couponId },
            data: {
                ...data,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                updatedAt: new Date(),
            },
        });
        return res.status(200).json({
            status: true,
            message: "Coupon updated successfully",
            data: coupon,
        });
    }
    catch (error) {
        console.error("Error in updating coupon", error);
        return res
            .status(500)
            .json({ status: false, message: "Internal server error" });
    }
};
exports.updateCoupon = updateCoupon;
const deleteCoupon = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role !== "ADMIN") {
        return res.status(403).json({ status: false, message: "Forbidden" });
    }
    const couponId = parseInt(req.params.couponId);
    if (isNaN(couponId)) {
        return res.status(400).json({
            status: false,
            message: "Invalid coupon ID",
        });
    }
    try {
        await prisma_1.db.coupon.delete({
            where: { id: couponId },
        });
        return res.status(200).json({
            status: true,
            message: "Coupon deleted successfully",
        });
    }
    catch (error) {
        console.error("Error in deleting coupon", error);
        return res
            .status(500)
            .json({ status: false, message: "Internal server error" });
    }
};
exports.deleteCoupon = deleteCoupon;
const validateCoupon = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    try {
        const { code, orderAmount, productIds, categoryIds } = req.body;
        const user = await prisma_1.db.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const coupon = await prisma_1.db.coupon.findUnique({
            where: { code },
        });
        if (!coupon)
            return res
                .status(404)
                .json({ status: false, message: "Coupon not found" });
        if (!coupon.isActive)
            return res
                .status(400)
                .json({ status: false, message: "Coupon inactive" });
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            return res
                .status(400)
                .json({ status: false, message: "Coupon expired or not started yet" });
        }
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return res
                .status(400)
                .json({ status: false, message: "Coupon usage limit reached" });
        }
        if (coupon.minimumAmount && orderAmount < coupon.minimumAmount) {
            return res
                .status(400)
                .json({ status: false, message: "Order amount too low" });
        }
        if (coupon.applicableToProducts) {
            const applicableProducts = coupon.applicableToProducts;
            const match = productIds.some((id) => applicableProducts.includes(id));
            if (!match)
                return res
                    .status(400)
                    .json({ status: false, message: "Coupon not valid for products" });
        }
        if (coupon.applicableToCategories) {
            const applicableCategories = coupon.applicableToCategories;
            const match = categoryIds.some((id) => applicableCategories.includes(id));
            if (!match)
                return res
                    .status(400)
                    .json({ status: false, message: "Coupon not valid for categories" });
        }
        let discount = 0;
        if (coupon.type === "PERCENTAGE") {
            discount = (orderAmount * Number(coupon.value)) / 100;
        }
        else if (coupon.type === "FIXED_AMOUNT") {
            discount = Number(coupon.value);
        }
        else if (coupon.type === "FREE_SHIPPING") {
            discount = 0;
        }
        if (coupon.maximumDiscount && discount > Number(coupon.maximumDiscount)) {
            discount = Number(coupon.maximumDiscount);
        }
        res.status(200).json({
            status: true,
            message: "Coupon applied successfully",
            data: discount,
        });
    }
    catch (error) {
        console.error("Error in validating coupon", error);
        return res
            .status(500)
            .json({ status: false, message: "Internal server error" });
    }
};
exports.validateCoupon = validateCoupon;
//# sourceMappingURL=couponController.js.map