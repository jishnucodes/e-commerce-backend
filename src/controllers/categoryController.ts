import { Request, Response } from "express";
import { db } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await db.category.findMany({
         include: {
            subCategories: true,
            products: true
         }
        });
        return res.status(200).json({
          status: "success",
          message: "Categories retrieved successfully",
          categories,
        });
      } catch (error) {
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
      }
}

export const getACategory = async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
const {id, role} = user;
  if (!id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
    const categoryId =  req.params.categoryId ? parseInt(req.params.categoryId) : undefined;

  if (!id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  try {
    const user = await db.user.findUnique({ where: { id: id } });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const category = await db.category.findUnique({
        where: { id: categoryId },
      include: {
        subCategories: true,
        products: true
        }
    });
  } catch (error) {
    console.error("Error fetching category", error)
    return res.status(500).json({
        status: "error",
      message: "Internal server error",
    });
  }
}
