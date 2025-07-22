import { Response } from "express";
import { db } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/authMiddleware";




export const getBrand = async (req: AuthenticatedRequest, res: Response) => {
  const {id,role} = req.user;


  if (!id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const user = await db.user.findUnique({ where: { id:id} });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const brandId = parseInt(req.params.brandId);
    if (isNaN(brandId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID",
      });
    }

    const brand = await db.brand.findUnique({
      where: { id: brandId },
      include: { products: true },
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand fetched successfully",
      data: brand,
    });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

