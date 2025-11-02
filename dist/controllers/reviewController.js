"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAReview = exports.updateReview = exports.createReview = exports.getReviewsOfAProduct = void 0;
const prisma_1 = require("../lib/prisma");
const getReviewsOfAProduct = async (req, res) => {
    const { user } = req;
    const { id: userId } = user;
    const productId = Number(req.params.productId);
    if (Number.isNaN(productId)) {
        return res.status(400).json({
            status: 'error',
            message: 'Product ID must be a valid number'
        });
    }
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: userId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        const existingProduct = await prisma_1.db.product.findUnique({ where: { id: productId } });
        if (!existingProduct) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }
        const reviews = await prisma_1.db.review.findMany({
            where: { productId: productId },
            include: {
                user: true
            }
        });
        return res.status(200).json({
            status: 'success',
            message: 'Reviews of the product fetched successfully',
            data: reviews
        });
    }
    catch (error) {
        console.error("Error fetching reviews of a product:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getReviewsOfAProduct = getReviewsOfAProduct;
const createReview = async (req, res) => {
    const { user } = req;
    const { id: tokenUserId } = user;
    const { productId, userId, rating, title, comment } = req.body;
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        const [existingProduct, existingUser] = await Promise.all([
            prisma_1.db.product.findUnique({ where: { id: productId } }),
            prisma_1.db.user.findUnique({ where: { id: userId } })
        ]);
        if (!existingProduct)
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        if (!existingUser)
            return res.status(404).json({ status: 'error', message: 'User not found' });
        const review = await prisma_1.db.review.create({
            data: {
                productId,
                userId,
                rating,
                title,
                comment
            }
        });
        return res.status(201).json({
            status: "success",
            message: "Review created successfully",
            review: review
        });
    }
    catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.createReview = createReview;
const updateReview = async (req, res) => {
    const { user } = req;
    const { id: tokenUserId } = user;
    const { productId, userId, rating, title, comment } = req.body;
    const reviewId = Number(req.params.reviewId);
    if (Number.isNaN(reviewId)) {
        return res.status(400).json({
            status: 'error',
            message: 'Review ID must be a valid number'
        });
    }
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        const [existingProduct, existingReview] = await Promise.all([
            prisma_1.db.product.findUnique({ where: { id: productId } }),
            prisma_1.db.review.findUnique({ where: { id: reviewId } })
        ]);
        if (!existingProduct)
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        if (!existingReview)
            return res.status(404).json({ status: 'error', message: 'Review not found' });
        if (existingReview.userId !== tokenUserId) {
            return res
                .status(403)
                .json({ status: "error", message: "Not authorized to update this review" });
        }
        const updateData = {};
        if (productId !== undefined)
            updateData.productId = productId;
        if (userId !== undefined)
            updateData.userId = userId;
        if (rating !== undefined)
            updateData.rating = rating;
        if (title !== undefined)
            updateData.title = title;
        if (comment !== undefined)
            updateData.comment = comment;
        const updatedReview = await prisma_1.db.review.update({
            where: { id: reviewId },
            data: updateData,
            include: { user: true }
        });
        return res.status(200).json({
            status: "success",
            message: "Review updated successfully",
            category: updatedReview
        });
    }
    catch (error) {
        console.error("Error updating review:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.updateReview = updateReview;
const deleteAReview = async (req, res) => {
    const { user } = req;
    const { id: tokenUserId } = user;
    const reviewId = Number(req.params.reviewId);
    if (Number.isNaN(reviewId)) {
        return res.status(400).json({
            status: 'error',
            message: 'Review ID must be a valid number'
        });
    }
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        const existingReview = await prisma_1.db.review.findUnique({
            where: { id: reviewId },
        });
        if (!existingReview) {
            return res
                .status(404)
                .json({ status: "error", message: "Review not found" });
        }
        if (existingReview.userId !== tokenUserId) {
            return res
                .status(403)
                .json({ status: "error", message: "Not authorized to delete this review" });
        }
        await prisma_1.db.review.delete({
            where: { id: reviewId }
        });
        return res.status(200).json({
            status: "success",
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting review:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.deleteAReview = deleteAReview;
//# sourceMappingURL=reviewController.js.map