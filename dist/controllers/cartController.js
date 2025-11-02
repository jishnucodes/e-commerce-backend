"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.updateCartItemQuantity = exports.removeProductFromCart = exports.addProductToCart = exports.getCartItemsOfUser = void 0;
const prisma_1 = require("../lib/prisma");
const getCartItemsOfUser = async (req, res) => {
    const { user } = req;
    const { id: userId } = user;
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: userId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        if (dbUser.id !== userId) {
            return res
                .status(403)
                .json({ status: "error", message: "Not authorized to fetch the cart items for this user" });
        }
        const cartItems = await prisma_1.db.cart.findMany({
            where: { userId },
            include: {
                user: true,
                cartItems: true
            }
        });
        return res.status(200).json({
            status: 'success',
            message: 'Cart list of the user fetched successfully',
            data: cartItems
        });
    }
    catch (error) {
        console.error("Error fetching cart list of a user:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getCartItemsOfUser = getCartItemsOfUser;
const addProductToCart = async (req, res) => {
    const { user } = req;
    const { id: tokenUserId } = user;
    const { productVariantId, quantity } = req.body;
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        const productVariant = await prisma_1.db.productVariant.findUnique({
            where: { id: productVariantId },
        });
        if (!productVariant) {
            return res
                .status(404)
                .json({ status: "error", message: "Product variant not found" });
        }
        const cart = (await prisma_1.db.cart.findFirst({ where: { userId: tokenUserId } })) ||
            (await prisma_1.db.cart.create({ data: { userId: tokenUserId } }));
        const existingCartItem = await prisma_1.db.cartItem.findFirst({
            where: { cartId: cart.id, productVariantId },
        });
        let cartItem;
        if (existingCartItem) {
            cartItem = await prisma_1.db.cartItem.update({
                where: { id: existingCartItem.id },
                data: { quantity: existingCartItem.quantity + quantity },
            });
        }
        else {
            cartItem = await prisma_1.db.cartItem.create({
                data: {
                    cartId: cart.id,
                    productVariantId,
                    quantity,
                },
            });
        }
        return res.status(201).json({
            status: "success",
            message: "Product added to cart successfully",
            data: cartItem,
        });
    }
    catch (error) {
        console.error("Error adding product to cart:", error);
        return res
            .status(500)
            .json({ status: "error", message: "Internal server error" });
    }
};
exports.addProductToCart = addProductToCart;
const removeProductFromCart = async (req, res) => {
    const { user } = req;
    const { id: tokenUserId } = user;
    const productVariantId = Number(req.params.productVariantId);
    if (Number.isNaN(productVariantId)) {
        return res.status(400).json({
            status: "error",
            message: "Product Variant ID must be a valid number",
        });
    }
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }
        const cart = await prisma_1.db.cart.findFirst({ where: { userId: tokenUserId } });
        if (!cart) {
            return res
                .status(404)
                .json({ status: "error", message: "Cart not found" });
        }
        const cartItem = await prisma_1.db.cartItem.findFirst({
            where: { cartId: cart.id, productVariantId },
        });
        if (!cartItem) {
            return res.status(404).json({
                status: "error",
                message: "Product not found in cart",
            });
        }
        let updatedItem = null;
        if (cartItem.quantity > 1) {
            updatedItem = await prisma_1.db.cartItem.update({
                where: { id: cartItem.id },
                data: { quantity: cartItem.quantity - 1 },
            });
        }
        else {
            await prisma_1.db.cartItem.delete({ where: { id: cartItem.id } });
        }
        return res.status(200).json({
            status: "success",
            message: cartItem.quantity > 1
                ? "Product quantity decreased successfully"
                : "Product removed from cart successfully",
            data: updatedItem,
        });
    }
    catch (error) {
        console.error("Error removing product from cart:", error);
        return res
            .status(500)
            .json({ status: "error", message: "Internal server error" });
    }
};
exports.removeProductFromCart = removeProductFromCart;
const updateCartItemQuantity = async (req, res) => {
    const { user } = req;
    const { id: tokenUserId } = user;
    const productVariantId = Number(req.params.productVariantId);
    const quantity = Number(req.body.quantity);
    if (Number.isNaN(productVariantId) || Number.isNaN(quantity)) {
        return res.status(400).json({
            status: "error",
            message: "Product Variant ID and quantity must be valid numbers",
        });
    }
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        const cart = await prisma_1.db.cart.findFirst({ where: { userId: tokenUserId } });
        if (!cart) {
            return res.status(404).json({ status: "error", message: "Cart not found" });
        }
        const cartItem = await prisma_1.db.cartItem.findFirst({
            where: { cartId: cart.id, productVariantId },
        });
        if (!cartItem) {
            return res.status(404).json({
                status: "error",
                message: "Product not found in cart",
            });
        }
        const updatedItem = await prisma_1.db.cartItem.update({
            where: { id: cartItem.id },
            data: { quantity },
        });
        return res.status(200).json({
            status: "success",
            message: "Product quantity updated successfully",
            data: updatedItem,
        });
    }
    catch (error) {
        console.error("Error updating product quantity in cart:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
};
exports.updateCartItemQuantity = updateCartItemQuantity;
const clearCart = async (req, res) => {
    const { user } = req;
    const { id: tokenUserId } = user;
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        const cart = await prisma_1.db.cart.findFirst({ where: { userId: tokenUserId } });
        if (!cart) {
            return res.status(404).json({ status: "error", message: "Cart not found" });
        }
        await prisma_1.db.cartItem.deleteMany({ where: { cartId: cart.id } });
        return res.status(200).json({
            status: 'success',
            message: 'Cart deleted successfully',
            data: null
        });
    }
    catch (error) {
        console.error("Error clearing products in cart:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
};
exports.clearCart = clearCart;
//# sourceMappingURL=cartController.js.map