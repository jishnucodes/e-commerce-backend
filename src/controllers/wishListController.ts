import { Request, Response } from "express";
import { db } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getWishListOfUser = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id: tokenUserId } = user;

    try {
        const dbUser = await db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Check ownership
        if (dbUser.id !== tokenUserId) {
            return res
                .status(403)
                .json({ status: "error", message: "Not authorized to fetch the wish list of this user" });
        }

        const wishList = await db.wishList.findMany({ where: { userId: tokenUserId }})

        return res.status(200).json({
            status: 'success',
            message: 'Wish list of the user fetched successfully',
            data: wishList
        });
    } catch (error) {
        console.error("Error fetching wish list of a user:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

export const addProductToWishList = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id: tokenUserId } = user;

    const {productId, createdBy, modifiedBy} = req.body;

    try {
        const dbUser = await db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Check ownership
        if (dbUser.id !== tokenUserId) {
            return res
                .status(403)
                .json({ status: "error", message: "Not authorized to create the wish list for this user" });
        }

        const product = await db.product.findUnique({ where: {id: productId}})
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        // Build update data dynamically
        const wishListData: any = {};
        if (tokenUserId !== undefined) wishListData.userId = tokenUserId;
        if (productId !== undefined) wishListData.productId = productId;
        if (createdBy !== undefined) wishListData.createdBy = createdBy;
        if (modifiedBy !== undefined) wishListData.modifiedBy = modifiedBy;

        const wishList = await db.wishList.create({
            data: wishListData
        });

        return res.status(201).json({
            status: "success",
            message: "Product added to wish list successfully",
            data: wishList
        });
    } catch (error) {
        console.error("Error adding product to wish list:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

export const removeProductFromWishList = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id: tokenUserId } = user;

    const wishListId = Number(req.params.wishListId);

    if (Number.isNaN(wishListId)) {
        return res.status(400).json({
            status: 'error',
            message: 'Wish List ID must be a valid number'
        });
    }

    try {
        const dbUser = await db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Check ownership
        if (dbUser.id !== tokenUserId) {
            return res
                .status(403)
                .json({ status: "error", message: "Not authorized to create the wish list for this user" });
        }

        const wishList = await db.wishList.findUnique({ where: {id: wishListId} })
        if (!wishList) {
            return res.status(404).json({ status: 'error', message: 'Wish list not found' });
        }

        await db.wishList.delete({ where: {id: wishListId} })

        return res.status(201).json({
            status: "success",
            message: "Product deleted from wish list successfully",
            data: wishList
        });

    } catch (error) {
        console.error("Error deleting product from wish list:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

export const clearWishList = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id: tokenUserId } = user;

    try {
        const dbUser = await db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        // Check ownership
        if (dbUser.id !== tokenUserId) {
            return res
                .status(403)
                .json({ status: "error", message: "Not authorized to clear the wish list of this user" });
        }

        await db.wishList.deleteMany({ where: {userId: tokenUserId} })

        return res.status(200).json({
            status: "success",
            message: "Wish list cleared successfully",
            data: null
        });
    } catch (error) {
        console.error("Error clearing wish list:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}