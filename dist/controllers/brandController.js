"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBrand = exports.updateBrand = exports.createBrand = exports.getBrands = exports.getBrand = void 0;
const prisma_1 = require("../lib/prisma");
const getBrand = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    if (!id) {
        return res.status(401).json({
            status: false,
            message: "Unauthorized",
        });
    }
    try {
        const user = await prisma_1.db.user.findUnique({ where: { id: id } });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found",
            });
        }
        const brandId = parseInt(req.params.brandId);
        if (isNaN(brandId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid brand ID",
            });
        }
        const brand = await prisma_1.db.brand.findUnique({
            where: { id: brandId },
            include: { products: true },
        });
        if (!brand) {
            return res.status(404).json({
                status: false,
                message: "Brand not found",
            });
        }
        const formattedBrand = {
            ...brand,
            image: brand.image
                ? `data:${brand.imageMime};base64,${Buffer.from(brand.image).toString("base64")}`
                : null,
        };
        return res.status(200).json({
            status: true,
            message: "Brand fetched successfully",
            data: formattedBrand,
        });
    }
    catch (error) {
        console.error("Error fetching brand:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getBrand = getBrand;
// export const getBrands = async (req: Request, res: Response) => {
//   try {
//     const brands = await db.brand.findMany({
//       include: {
//         products: true,
//       },
//     });
//     const formatted = brands.map((brand) => ({
//       ...brand,
//       image: brand?.image
//         ? `data:image/jpeg;base64,${Buffer.from(brand.image).toString("base64")}`
//         : null,
//     }));
//     return res.status(200).json({
//       status: true,
//       message: "Brands retrieved successfully",
//       data: formatted,
//     });
//   } catch (error) {
//     console.error("Error retrieving brands:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };
// export const createBrand = async (req: Request, res: Response) => {
//   const { user } = req as AuthenticatedRequest;
//   const { id, role } = user;
//   const { brandName, slug, image } = req.body;
//   const imageBuffer = image ? Buffer.from(image, "base64") : null;
//   if (!id) {
//     return res.status(401).json({ status: false, message: "Unauthorized" });
//   }
//   // Optional: lock this down to admins (or whatever roles you allow)
//   if (role !== "ADMIN") {
//     return res.status(403).json({ success: false, message: "Forbidden" });
//   }
//   try {
//     const user = await db.user.findUnique({ where: { id: id } });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ status: false, message: "User not found" });
//     }
//     const isSlugExist = await db.brand.findUnique({
//       where: {
//         slug,
//       },
//     });
//     if (isSlugExist) {
//       return res
//         .status(400)
//         .json({
//           status: false,
//           message: "Already the slug name is existing",
//         });
//     }
//     const newBrand = await db.brand.create({
//       data: {
//         brandName,
//         slug,
//         image: imageBuffer,
//       },
//     });
//     return res.status(201).json({
//       status: true,
//       message: "Brand created successfully",
//       data: {
//         id: newBrand.id,
//       },
//     });
//   } catch (error) {
//     console.error("Error creating brand", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };
const getBrands = async (req, res) => {
    try {
        const brands = await prisma_1.db.brand.findMany({
            include: { products: true },
        });
        const formatted = brands.map((brand) => ({
            ...brand,
            image: brand.image
                ? `data:${brand.imageMime};base64,${Buffer.from(brand.image).toString("base64")}`
                : null,
        }));
        return res.status(200).json({
            status: true,
            message: "Brands retrieved successfully",
            data: formatted,
        });
    }
    catch (error) {
        console.error("Error retrieving brands:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.getBrands = getBrands;
const createBrand = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    const { brandName, slug, image } = req.body;
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
        const isSlugExist = await prisma_1.db.brand.findUnique({ where: { slug } });
        if (isSlugExist) {
            return res.status(400).json({
                status: false,
                message: "Slug already exists",
            });
        }
        let imageBuffer = null;
        let mimeType = null;
        if (image) {
            mimeType = image.match(/^data:(image\/\w+);base64/)?.[1] || null;
            const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
            imageBuffer = Buffer.from(base64Data, "base64");
        }
        const newBrand = await prisma_1.db.brand.create({
            data: {
                brandName,
                slug,
                image: imageBuffer,
                imageMime: mimeType,
            },
        });
        return res.status(201).json({
            status: true,
            message: "Brand created successfully",
            data: { id: newBrand.id },
        });
    }
    catch (error) {
        console.error("Error creating brand", error);
        return res
            .status(500)
            .json({ status: false, message: "Internal server error" });
    }
};
exports.createBrand = createBrand;
const updateBrand = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role !== "ADMIN") {
        return res.status(403).json({ status: false, message: "Forbidden" });
    }
    const brandId = parseInt(req.params.brandId);
    if (isNaN(brandId)) {
        return res.status(400).json({ status: false, message: "Invalid brand ID" });
    }
    const { brandName, slug, image } = req.body;
    const imageBuffer = image ? Buffer.from(image, "base64") : undefined;
    try {
        const existingBrand = await prisma_1.db.brand.findUnique({ where: { id: brandId } });
        if (!existingBrand) {
            return res
                .status(404)
                .json({ status: false, message: "Brand not found" });
        }
        let imageBuffer = null;
        let mimeType = null;
        if (image) {
            mimeType = image.match(/^data:(image\/\w+);base64/)?.[1] || null;
            const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
            imageBuffer = Buffer.from(base64Data, "base64");
        }
        const updatedBrand = await prisma_1.db.brand.update({
            where: { id: brandId },
            data: {
                brandName: brandName || existingBrand.brandName,
                slug: slug || existingBrand.slug,
                ...(imageBuffer ? { image: imageBuffer, imageMime: mimeType } : {}),
            },
        });
        return res.status(200).json({
            status: true,
            message: "Brand updated successfully",
            data: {
                id: updatedBrand.id,
                brandName: updatedBrand.brandName,
                slug: updatedBrand.slug,
                image: updatedBrand.image
                    ? `data:${updatedBrand.imageMime};base64,${Buffer.from(updatedBrand.image).toString("base64")}`
                    : null,
            },
        });
    }
    catch (error) {
        console.error("Error updating brand", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.updateBrand = updateBrand;
const deleteBrand = async (req, res) => {
    const { user } = req;
    const { id, role } = user;
    if (!id) {
        return res.status(401).json({ status: false, message: "Unauthorized" });
    }
    if (role !== "ADMIN") {
        return res.status(403).json({ status: false, message: "Forbidden" });
    }
    const brandId = parseInt(req.params.brandId);
    if (isNaN(brandId)) {
        return res.status(400).json({ status: false, message: "Invalid brand ID" });
    }
    try {
        const Brand = await prisma_1.db.brand.findUnique({ where: { id: brandId } });
        if (!Brand) {
            return res
                .status(404)
                .json({ status: false, message: "Brand not found" });
        }
        await prisma_1.db.brand.delete({ where: { id: brandId } });
        res.status(200).json({
            status: true,
            message: "Brand deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting brand:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.deleteBrand = deleteBrand;
