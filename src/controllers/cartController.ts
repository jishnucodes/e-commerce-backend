import { Request, Response } from "express";
import { db } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getCartItemsOfUser = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id: userId } = user;

    try {
        const dbUser = await db.user.findUnique({ where: { id: userId } });
        if (!dbUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Check ownership
        if (dbUser.id !== userId) {
            return res
                .status(403)
                .json({ status: "error", message: "Not authorized to fetch the cart items for this user" });
        }

        const cartItems = await db.cart.findMany({
            where: { userId },
            include: {
                user: true,
                cartItems: true
            }
        })

        return res.status(200).json({
            status: 'success',
            message: 'Cart list of the user fetched successfully',
            data: cartItems
        });

    } catch (error) {
        console.error("Error fetching cart list of a user:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

export const addProductToCart = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: tokenUserId } = user;
  const { productVariantId, quantity } = req.body;

  try {
    // Ensure user exists
    const dbUser = await db.user.findUnique({ where: { id: tokenUserId } });
    if (!dbUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // Ensure product variant exists
    const productVariant = await db.productVariant.findUnique({
      where: { id: productVariantId },
    });
    if (!productVariant) {
      return res
        .status(404)
        .json({ status: "error", message: "Product variant not found" });
    }

    // Find or create cart
    const cart =
      (await db.cart.findFirst({ where: { userId: tokenUserId } })) ||
      (await db.cart.create({ data: { userId: tokenUserId } }));

    // Check if item already exists in cart
    const existingCartItem = await db.cartItem.findFirst({
      where: { cartId: cart.id, productVariantId },
    });

    let cartItem;
    if (existingCartItem) {
      cartItem = await db.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
    } else {
      cartItem = await db.cartItem.create({
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
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

export const removeProductFromCart = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: tokenUserId } = user;

  const productVariantId = Number(req.params.productVariantId);

  if (Number.isNaN(productVariantId)) {
    return res.status(400).json({
      status: "error",
      message: "Product Variant ID must be a valid number",
    });
  }

  try {
    // Ensure user exists
    const dbUser = await db.user.findUnique({ where: { id: tokenUserId } });
    if (!dbUser) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    // Find the user's cart
    const cart = await db.cart.findFirst({ where: { userId: tokenUserId } });
    if (!cart) {
      return res
        .status(404)
        .json({ status: "error", message: "Cart not found" });
    }

    // Find cart item belonging to this cart
    const cartItem = await db.cartItem.findFirst({
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
      // Decrement quantity
      updatedItem = await db.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: cartItem.quantity - 1 },
      });
    } else {
      // Remove item entirely
      await db.cartItem.delete({ where: { id: cartItem.id } });
    }

    return res.status(200).json({
      status: "success",
      message:
        cartItem.quantity > 1
          ? "Product quantity decreased successfully"
          : "Product removed from cart successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

export const updateCartItemQuantity = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
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
    // Ensure user exists
    const dbUser = await db.user.findUnique({ where: { id: tokenUserId } });
    if (!dbUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }
    // Find the user's cart
    const cart = await db.cart.findFirst({ where: { userId: tokenUserId } });
    if (!cart) {
      return res.status(404).json({ status: "error", message: "Cart not found" });
    }

    // Find cart item belonging to this cart
    const cartItem = await db.cartItem.findFirst({
      where: { cartId: cart.id, productVariantId },
    });

    if (!cartItem) {
      return res.status(404).json({
        status: "error",
        message: "Product not found in cart",
      });
    }

    // Update cart item quantity
    const updatedItem = await db.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    });

    return res.status(200).json({
        status: "success",
      message: "Product quantity updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating product quantity in cart:", error);
    return res.status(500).json({
        status: "error",
      message: "Internal server error",
    });
  }
};

export const clearCart = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    const { id: tokenUserId } = user;

    try {
        const dbUser = await db.user.findUnique({ where: { id: tokenUserId } });
        if (!dbUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        // Find the user's cart
        const cart = await db.cart.findFirst({ where: { userId: tokenUserId } });
        if (!cart) {
            return res.status(404).json({ status: "error", message: "Cart not found" });
        }

        // Delete all cart items belonging to this cart
        await db.cartItem.deleteMany({ where: { cartId: cart.id } });

        return res.status(200).json({
            status: 'success',
            message: 'Cart deleted successfully',
            data: null
        });
    } catch (error) {
        console.error("Error clearing products in cart:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}







































