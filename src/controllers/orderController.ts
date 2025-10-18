import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { cancelOrder, createOrder, getOrderById, getOrders, updateOrder, updateOrderStatus } from "../service/orderService";

export const createOrderController = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role } = user;

  try {
    const order = await createOrder({ ...req.body, userId, role });
    return res
      .status(201)
      .json({
        status: "success",
        message: "Order created successfully",
        data: order,
      });
  } catch (err) {
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

export const getOrdersController = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      sortBy = "createdAt",
      order = "desc",
      status = "ACTIVE",
    } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // --- Build dynamic filters ---
    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      }),
      // ...(categoryId && { categoryId: Number(categoryId) }),
      // ...(brandId && { brandId: Number(brandId) }),
      ...(status && { status }),
    };

    const inputData = {
      skip,
      take,
      where,
      sortBy,
      order,
    };

    // 🧠 Call service function
    const { orders, total } = await getOrders({
      ...inputData,
      order: order === "asc" ? "asc" : "desc", // Ensure type is "asc" | "desc"
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
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getAOrderController = async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthenticatedRequest;
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

    const order = await getOrderById(orderId)

    return res.status(200).json({
      status: true,
      message: "Order details fetched successfully",
      data: {order},
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch order",
    });
  }
};

export const updateOrderController = async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthenticatedRequest;
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

    const updateAOrder = await updateOrder({ ...req.body, userId, role })

    return res
      .status(201)
      .json({
        status: "success",
        message: "Order updated successfully",
        data: updateAOrder,
      });
  } catch (err) {
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
}

export const cancelOrderController = async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthenticatedRequest;
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

    const cancelAOrder = await cancelOrder({ ...req.body, userId, role })

    return res
      .status(201)
      .json({
        status: "success",
        message: "Order cancelled successfully",
        data: cancelAOrder,
      });
  } catch (err) {
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
}

export const updateOrderStatusController = async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthenticatedRequest;
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

    const updateAOrder = await updateOrderStatus({ ...req.body, userId, role })

    return res
      .status(201)
      .json({
        status: "success",
        message: "Order status updated successfully",
        data: updateAOrder,
      });
  } catch (err) {
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
}
