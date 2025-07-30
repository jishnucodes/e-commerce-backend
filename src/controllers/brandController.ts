import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { db } from "../lib/prisma";



export const getBrand = async (req: Request, res: Response) => {

const { user } = req as AuthenticatedRequest;
const {id, role} = user;
  if (!id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const user = await db.user.findUnique({ where: { id: id } });

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


export const getBrands = async (req:Request, res: Response) => {
  try {
    const brands = await db.brand.findMany({
      include: {
        products: true,
      }
    });

    return res.status(200).json({
      status: "success",
      message: "Brands retrieved successfully",
      brands,
    });
  } catch (error) {
    console.error("Error retrieving brands:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const createBrand = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const {id, role} = user;

const { brandName, slug, image } = req.body;
const imageBuffer = image ? Buffer.from(image, 'base64') : null;
  if (!id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  
  // Optional: lock this down to admins (or whatever roles you allow)
  if (role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

   try {
    const user = await db.user.findUnique({ where: { id: id } });
    
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
 
    const newBrand = await db.brand.create({
      data: {
        brandName,
        slug,
        image:imageBuffer
      }
    })
 
    return res.status(201).json({
      status: "success",
      message: "Brand created successfully",
      brand: {
        id: newBrand.id,
      },
    });
  } catch (error) {
    console.error("Error creating brand", error)
    return res.status(500).json({
        status: "error",
      message: "Internal server error",
    });
  }
};

export const updateBrand = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id, role } = user;

  if (!id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  if (role !== "ADMIN") {
    return res.status(403).json({ status: "error", message: "Forbidden" });
  }

  const brandId = parseInt(req.params.id);
  if (isNaN(brandId)) {
    return res.status(400).json({ status: "error", message: "Invalid brand ID" });
  }

  const { brandName, slug, image } = req.body;
  const imageBuffer = image ? Buffer.from(image, "base64") : undefined;

  try {
    const Brand = await db.brand.findUnique({ where: { id: brandId } });
    if (!Brand) {
      return res.status(404).json({ status: "error", message: "Brand not found" });
    }

    const updatedBrand = await db.brand.update({
      where: { id: brandId },
      data: {
        brandName: brandName || Brand.brandName,
        slug: slug || Brand.slug,
        ...(imageBuffer ? { image: imageBuffer } : {}),
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Brand updated successfully",
      brand: {
        id: updatedBrand.id,
        brandName: updatedBrand.brandName,
        slug: updatedBrand.slug,
      },
    });
  } catch (error) {
    console.error("Error updating brand", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const deleteBrand = async (req:Request, res: Response) =>{
  const { user } = req as AuthenticatedRequest;
  const { id, role } = user;
   if (!id) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  if (role !== "ADMIN") {
    return res.status(403).json({ status: "error", message: "Forbidden" });
  }

  const brandId = parseInt(req.params.id);
  if (isNaN(brandId)) {
    return res.status(400).json({ status: "error", message: "Invalid brand ID" });
  }

   try {
    const Brand = await db.brand.findUnique({ where: { id: brandId } });
    if (!Brand) {
      return res.status(404).json({ status: "error", message: "Brand not found" });
    }
    await db.brand.delete({where :{id:brandId}})
    res.status(500).json({
      status: "success",
      message: "Brand deleted successfully",
    });

}
   catch(error){
   console.error("Error deleting brand:",error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
}
}
