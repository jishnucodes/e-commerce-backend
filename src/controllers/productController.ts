import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Prisma } from "@prisma/client";
import { db } from "../lib/prisma";
import { buildProductDTO } from "../dto/productDTO";
import slugify from "slugify";

// --- Utility: retry wrapper ---
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 300
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err.code === "P1001" || err.code === "P2028")) {
      console.warn(`⚠️ Retrying Prisma op... ${retries} left`);
      await new Promise((r) => setTimeout(r, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

// --- Utility: batch executor ---
async function executeInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (batch: T[]) => Promise<void>
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await fn(batch);
  }
}

// --- Utility: rollback ---
async function rollbackProduct(productId: number) {
  await db.stockMovement.deleteMany({
    where: { productVariant: { productId } },
  });
  await db.inventory.deleteMany({
    where: { productVariant: { productId } },
  });
  await db.productVariant.deleteMany({ where: { productId } });
  await db.productImage.deleteMany({ where: { productId } });
  await db.product.delete({ where: { id: productId } });
}

// export const updateProduct = async (req: Request, res: Response) => {
//   const { user } = req as AuthenticatedRequest;
//   const { id: userId, role } = user;

//   if (role !== "ADMIN")
//     return res
//       .status(403)
//       .json({ status: false, message: "User is not admin" });

//   const productId = parseInt(req.params.productId);
//   const productObj = buildProductDTO(req.body);
//   const variants = productObj.variants;
//   const productImages = productObj.productImages;

//   try {
//     const dbUser = await db.user.findUnique({ where: { id: userId } });
//     if (!dbUser)
//       return res
//         .status(404)
//         .json({ status: false, message: "User not found" });

//     const [existingProduct, existingBrand, existingCategory] =
//       await Promise.all([
//         db.product.findUnique({ where: { id: productId } }),
//         db.brand.findUnique({ where: { id: productObj.brandId } }),
//         db.category.findUnique({ where: { id: productObj.categoryId } }),
//       ]);

//     if (!existingProduct)
//       return res
//         .status(400)
//         .json({ status: false, message: "Product not found" });
//     if (!existingBrand)
//       return res
//         .status(400)
//         .json({ status: false, message: "Brand not found" });
//     if (!existingCategory)
//       return res
//         .status(400)
//         .json({ status: false, message: "Category not found" });

//     const updatedProduct = await db.$transaction(async (tx) => {
//       const product = await tx.product.update({
//         where: { id: productId },
//         data: {
//           name: productObj.name,
//           description: productObj.description,
//           slug: productObj.slug,
//           status: productObj.status,
//           brandId: productObj.brandId,
//           categoryId: productObj.categoryId,
//           metaTitle: productObj.metaTitle,
//           metaDescription: productObj.metaDescription,
//           basePrice: productObj.basePrice,
//           modifiedBy: userId,
//         },
//       });

//       // --- Handle product images ---
//       const existingImages = await tx.productImage.findMany({
//         where: { productId },
//       });

//       // Track existing image IDs from the DB and new ones from input
//       const existingImageIds = existingImages.map((img) => img.id);
//       const newImageIds = productImages.map((img) => img.id);

//       // Delete removed images (those not present in payload)
//       const toDelete = existingImageIds.filter(
//         (id) => !newImageIds.includes(id)
//       );
//       if (toDelete.length > 0) {
//         await tx.productImage.deleteMany({
//           where: { id: { in: toDelete } },
//         });
//       }

//       // Calculate next sortOrder start
//       const { _max } = await tx.productImage.aggregate({
//         where: { productId },
//         _max: { sortOrder: true },
//       });
//       let nextSortOrder = (_max.sortOrder ?? -1) + 1;

//       // Iterate over input images
//       for (const img of productImages) {
//         const imageBuffer = img.base64
//           ? Buffer.from(img.base64, "base64")
//           : null;

//         if (existingImageIds.includes(img.id)) {
//           // --- Update existing image ---
//           await tx.productImage.update({
//             where: { id: img.id },
//             data: {
//               altText: img.altText,
//               isMain: img.isMain || false,
//               // If user re-uploads (base64 provided), update image content
//               ...(imageBuffer && { imageUrl: imageBuffer }),
//             },
//           });
//         } else {
//           // --- Add new image ---
//           await tx.productImage.create({
//             data: {
//               productId: product.id,
//               imageUrl: imageBuffer,
//               altText: img.altText,
//               isMain: img.isMain || false,
//               sortOrder: nextSortOrder++,
//             },
//           });
//         }
//       }

//       // Handle variants
//       const existingVariants = await tx.productVariant.findMany({
//         where: { productId },
//       });
//       const existingVariantIds = existingVariants.map((v) => v.id);

//       for (const v of variants) {
//         await tx.productVariant.upsert({
//           where: { id: v.id || -1 }, // Handle case where id might be undefined for new variants
//           create: {
//             productId: product.id,
//             sku: v.sku,
//             price: v.price,
//             comparePrice: v.comparePrice,
//             cost: v.cost,
//             stock: v.stock,
//             weight: v.weight,
//             dimensions: v.dimensions,
//             isActive: v.isActive,
//             attributes: v.attributes,
//           },
//           update: {
//             sku: v.sku,
//             price: v.price,
//             comparePrice: v.comparePrice,
//             cost: v.cost,
//             stock: v.stock,
//             weight: v.weight,
//             dimensions: v.dimensions,
//             isActive: v.isActive,
//             attributes: v.attributes,
//           },
//         });
//       }

//       // Delete variants that are no longer needed
//       const newVariantIds = variants
//         .map((v) => v.id)
//         .filter((id) => id !== undefined);
//       const variantIdsToDelete = existingVariantIds.filter(
//         (id) => !newVariantIds.includes(id)
//       );
//       const variantIds = existingVariantIds.filter((id) =>
//         newVariantIds.includes(id)
//       );

//       for (const id of variantIdsToDelete) {
//         // Delete related records first
//         await tx.inventory.deleteMany({ where: { productVariantId: id } });
//         await tx.stockMovement.deleteMany({ where: { productVariantId: id } });

//         // Then delete the variant
//         await tx.productVariant.delete({ where: { id } });
//       }

//       for (const id of variantIds) {
//         const variant = variants.find((v) => v.id === id);
//         if (!variant) continue;

//         const initial = variant.stock ?? 0;

//         await tx.inventory.upsert({
//           where: { productVariantId: variant.id },
//           create: {
//             productVariantId: variant.id,
//             quantity: initial,
//             reservedQuantity: 0,
//             lowStockThreshold: variant.lowStockThreshold,
//             trackInventory: true,
//           },
//           update: {
//             quantity: initial,
//             reservedQuantity: 0,
//             lowStockThreshold: variant.lowStockThreshold,
//             trackInventory: true,
//           },
//         });

//         if (initial !== 0) {
//           await tx.stockMovement.create({
//             data: {
//               productVariantId: variant.id,
//               type: variant.stockMovementType,
//               quantity: initial,
//               reason: "INITIAL",
//             },
//           });
//         }
//       }

//       return product;
//     });

//     // Send success response
//     return res.status(200).json({
//       status: true,
//       message: "Product updated successfully",
//       data: updatedProduct,
//     });
//   } catch (error) {
//     console.error("Error updating product:", error);

//     // Handle specific error cases
//     if (
//       error instanceof Error &&
//       error.message === "Product image is required"
//     ) {
//       return res
//         .status(400)
//         .json({ status: false, message: "Product image is required" });
//     }

//     return res.status(500).json({
//       status: false,
//       message: "Internal server error while updating product",
//     });
//   }
// };

export const createProduct = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role } = user;

  if (role !== "ADMIN")
    return res
      .status(403)
      .json({ status: false, message: "User is not admin" });

  const productObj = buildProductDTO(req.body);
  const variants = productObj.variants || [];
  const productImages = productObj.productImages || [];

  try {
    // Validate user, brand, category in parallel
    const [dbUser, existingBrand, existingCategory] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.brand.findUnique({ where: { id: productObj.brandId } }),
      db.category.findUnique({ where: { id: productObj.categoryId } }),
    ]);

    if (!dbUser)
      return res.status(404).json({ status: false, message: "User not found" });
    if (!existingBrand)
      return res
        .status(400)
        .json({ status: false, message: "Brand not found" });
    if (!existingCategory)
      return res
        .status(400)
        .json({ status: false, message: "Category not found" });

    // All operations inside one atomic transaction
    const createdProduct = await db.$transaction(async (tx) => {
      // Create Product
      const product = await tx.product.create({
        data: {
          name: productObj.name,
          description: productObj.description,
          slug: productObj.slug,
          status: productObj.status,
          brandId: productObj.brandId,
          categoryId: productObj.categoryId,
          metaTitle: productObj.metaTitle,
          metaDescription: productObj.metaDescription,
          basePrice: productObj.basePrice,
          createdBy: userId,
          modifiedBy: userId,
        },
      });

      // Create Images
      if (productImages.length > 0) {
        const imageRecords = productImages.map((img, i) => ({
          productId: product.id,
          imageUrl: img.base64 ? Buffer.from(img.base64, "base64") : null,
          altText: img.altText,
          sortOrder: i,
          isMain: img.isMain || false,
        }));
        await tx.productImage.createMany({ data: imageRecords });
      }

      // Create Variants and get their IDs
      const variantRecords = variants.map((v) => ({
        productId: product.id,
        sku: v.sku,
        price: v.price,
        comparePrice: v.comparePrice,
        cost: v.cost,
        stock: v.stock,
        weight: v.weight,
        dimensions: v.dimensions,
        isActive: v.isActive,
        attributes: v.attributes,
      }));

      const createdVariants = await Promise.all(
        variantRecords.map((v) => tx.productVariant.create({ data: v }))
      );

      // Create Inventory + Stock Movements
      const inventoryRecords = [];
      const movementRecords = [];

      for (let i = 0; i < createdVariants.length; i++) {
        const variant = createdVariants[i];
        const sourceVariant = variants[i];
        const initial = sourceVariant.stock ?? 0;

        inventoryRecords.push({
          productVariantId: variant.id,
          quantity: initial,
          reservedQuantity: 0,
          lowStockThreshold: sourceVariant.lowStockThreshold ?? 0,
          trackInventory: true,
        });

        if (initial > 0) {
          movementRecords.push({
            productVariantId: variant.id,
            type: sourceVariant.stockMovementType || "PURCHASE",
            quantity: initial,
            reason: "INITIAL",
          });
        }
      }

      if (inventoryRecords.length > 0) {
        await tx.inventory.createMany({ data: inventoryRecords });
      }
      if (movementRecords.length > 0) {
        await tx.stockMovement.createMany({ data: movementRecords });
      }

      return product;
    });

    //If we reached here, everything succeeded
    return res.status(201).json({
      status: true,
      message: "Product created successfully",
      data: { id: createdProduct.id },
    });
  } catch (error: any) {
    console.error("Error creating product:", error);

    // Prisma unique constraint error
    if (error.code === "P2002") {
      return res.status(400).json({
        status: false,
        message: `Duplicate entry: ${error.meta?.target?.join(", ")}`,
      });
    }

    return res
      .status(500)
      .json({ status: false, message: "Failed to create product" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role } = user;

  if (role !== "ADMIN")
    return res
      .status(403)
      .json({ status: false, message: "User is not admin" });

  const productId = parseInt(req.params.productId);
  const productObj = buildProductDTO(req.body);
  const variants = productObj.variants || [];
  const productImages = productObj.productImages || [];

  try {
    // Validate entities in parallel
    const [dbUser, existingProduct, existingBrand, existingCategory] =
      await Promise.all([
        db.user.findUnique({ where: { id: userId } }),
        db.product.findUnique({ where: { id: productId } }),
        db.brand.findUnique({ where: { id: productObj.brandId } }),
        db.category.findUnique({ where: { id: productObj.categoryId } }),
      ]);

    if (!dbUser)
      return res.status(404).json({ status: false, message: "User not found" });
    if (!existingProduct)
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    if (!existingBrand)
      return res
        .status(400)
        .json({ status: false, message: "Brand not found" });
    if (!existingCategory)
      return res
        .status(400)
        .json({ status: false, message: "Category not found" });

    // All core operations in one atomic transaction ----
    const updatedProduct = await db.$transaction(async (tx) => {
      // Update product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name: productObj.name,
          description: productObj.description,
          slug: productObj.slug,
          status: productObj.status,
          brandId: productObj.brandId,
          categoryId: productObj.categoryId,
          metaTitle: productObj.metaTitle,
          metaDescription: productObj.metaDescription,
          basePrice: productObj.basePrice,
          modifiedBy: userId,
        },
      });

      
      // Normalize IDs — backend IDs are numeric, frontend temp IDs are strings like "img123"
      const existingImages = await tx.productImage.findMany({
        where: { productId },
      });
      const existingImageIds = existingImages.map((img) => String(img.id));

      const incomingImages = productImages || [];

      // Separate valid numeric IDs from fake frontend IDs
      const validExistingImages = incomingImages.filter(
        (img) => img.id && existingImageIds.includes(String(img.id))
      );

      const newImages = incomingImages.filter(
        (img) => !img.id || !existingImageIds.includes(String(img.id))
      );

      // Delete removed images (those in DB but not in incoming list)
      const incomingValidIds = validExistingImages.map((i) => String(i.id));
      const toDelete = existingImageIds.filter(
        (id) => !incomingValidIds.includes(id)
      );

      if (toDelete.length) {
        await tx.productImage.deleteMany({
          where: { id: { in: toDelete.map((id) => Number(id)) } },
        });
      }

      // Update existing images
      for (const img of validExistingImages) {
        await tx.productImage.update({
          where: { id: Number(img.id) },
          data: {
            altText: img.altText,
            isMain: img.isMain || false,
            ...(img.base64 && { imageUrl: Buffer.from(img.base64, "base64") }),
          },
        });
      }

      // Create new images
      if (newImages.length) {
        await tx.productImage.createMany({
          data: newImages.map((img, i) => ({
            productId,
            imageUrl: img.base64 ? Buffer.from(img.base64, "base64") : null,
            altText: img.altText,
            sortOrder: i,
            isMain: img.isMain || false,
          })),
        });
      }

      // Variants (handle via SKU)
      const existingVariants = await tx.productVariant.findMany({
        where: { productId },
      });
      const existingSkuMap = new Map(existingVariants.map((v) => [v.sku, v]));

      const incomingSkus = new Set(variants.map((v) => v.sku));
      const toDeleteSkus = existingVariants
        .filter((v) => !incomingSkus.has(v.sku))
        .map((v) => v.sku);

      // Delete removed variants and related inventory/movements
      if (toDeleteSkus.length) {
        const toDeleteIds = existingVariants
          .filter((v) => toDeleteSkus.includes(v.sku))
          .map((v) => v.id);

        await tx.stockMovement.deleteMany({
          where: { productVariantId: { in: toDeleteIds } },
        });
        await tx.inventory.deleteMany({
          where: { productVariantId: { in: toDeleteIds } },
        });
        await tx.productVariant.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      // Upsert variants
      for (const v of variants) {
        await tx.productVariant.upsert({
          where: { sku: v.sku },
          create: {
            productId,
            sku: v.sku,
            price: v.price,
            comparePrice: v.comparePrice,
            cost: v.cost,
            stock: v.stock,
            weight: v.weight,
            dimensions: v.dimensions,
            isActive: v.isActive,
            attributes: v.attributes,
          },
          update: {
            price: v.price,
            comparePrice: v.comparePrice,
            cost: v.cost,
            stock: v.stock,
            weight: v.weight,
            dimensions: v.dimensions,
            isActive: v.isActive,
            attributes: v.attributes,
          },
        });
      }

      // Inventory & Stock Movements
      const finalVariants = await tx.productVariant.findMany({
        where: { productId },
      });
      const skuToId = new Map(finalVariants.map((v) => [v.sku, v.id]));

      const inventoryRecords: any[] = [];
      const movementRecords: any[] = [];

      for (const v of variants) {
        const variantId = skuToId.get(v.sku);
        if (!variantId) continue;

        const oldStock = existingSkuMap.get(v.sku)?.stock ?? 0;
        const newStock = v.stock ?? 0;
        const delta = newStock - oldStock;

        inventoryRecords.push({
          productVariantId: variantId,
          quantity: newStock,
          reservedQuantity: 0,
          lowStockThreshold: v.lowStockThreshold ?? 0,
          trackInventory: true,
        });

        if (delta !== 0) {
          movementRecords.push({
            productVariantId: variantId,
            type: delta > 0 ? "PURCHASE" : "ADJUSTMENT",
            quantity: Math.abs(delta),
            reason: delta > 0 ? "STOCK INCREASE" : "STOCK DECREASE",
          });
        }
      }

      // Upsert inventory
      for (const inv of inventoryRecords) {
        await tx.inventory.upsert({
          where: { productVariantId: inv.productVariantId },
          create: inv,
          update: inv,
        });
      }

      // Create stock movements
      if (movementRecords.length) {
        await tx.stockMovement.createMany({ data: movementRecords });
      }

      return product;
    }); 

    return res.status(200).json({
      status: true,
      message: "Product updated successfully",
      data: { id: updatedProduct.id },
    });
  } catch (error: any) {
    console.error("Error updating product:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        status: false,
        message: `Duplicate entry: ${error.meta?.target?.join(", ")}`,
      });
    }

    return res.status(500).json({
      status: false,
      message: "Failed to update product",
    });
  }
};

// export const updateProduct = async (req: Request, res: Response) => {
//   const { user } = req as AuthenticatedRequest;
//   const { id: userId, role } = user;

//   if (role !== "ADMIN")
//     return res.status(403).json({ status: false, message: "User is not admin" });

//   const productId = parseInt(req.params.productId);
//   const productObj = buildProductDTO(req.body);
//   const variants = productObj.variants || [];
//   const productImages = productObj.productImages || [];

//   try {
//     // --- Validate user, product, brand, category ---
//     const [dbUser, existingProduct, existingBrand, existingCategory] = await Promise.all([
//       db.user.findUnique({ where: { id: userId } }),
//       db.product.findUnique({ where: { id: productId } }),
//       db.brand.findUnique({ where: { id: productObj.brandId } }),
//       db.category.findUnique({ where: { id: productObj.categoryId } }),
//     ]);

//     if (!dbUser) return res.status(404).json({ status: false, message: "User not found" });
//     if (!existingProduct) return res.status(400).json({ status: false, message: "Product not found" });
//     if (!existingBrand) return res.status(400).json({ status: false, message: "Brand not found" });
//     if (!existingCategory) return res.status(400).json({ status: false, message: "Category not found" });

//     // --- Update core product (atomic) ---
//     const updatedProduct = await db.$transaction(async (tx) =>
//       tx.product.update({
//         where: { id: productId },
//         data: {
//           name: productObj.name,
//           description: productObj.description,
//           slug: productObj.slug,
//           status: productObj.status,
//           brandId: productObj.brandId,
//           categoryId: productObj.categoryId,
//           metaTitle: productObj.metaTitle,
//           metaDescription: productObj.metaDescription,
//           basePrice: productObj.basePrice,
//           modifiedBy: userId,
//         },
//       })
//     );

//     // --- Handle product images efficiently ---
//     const existingImages = await db.productImage.findMany({ where: { productId } });
//     const existingImageIds = existingImages.map((img) => img.id);
//     const incomingImageIds = productImages.map((img) => img.id).filter(Boolean);

//     // Delete removed
//     const toDelete = existingImageIds.filter((id) => !incomingImageIds.includes(id));
//     if (toDelete.length) await db.productImage.deleteMany({ where: { id: { in: toDelete } } });

//     // Update existing
//     await executeInBatches(
//       productImages.filter((img) => img.id && existingImageIds.includes(img.id)),
//       20,
//       async (batch) => {
//         await Promise.all(
//           batch.map((img) =>
//             db.productImage.update({
//               where: { id: img.id },
//               data: {
//                 altText: img.altText,
//                 isMain: img.isMain || false,
//                 ...(img.base64 && { imageUrl: Buffer.from(img.base64, "base64") }),
//               },
//             })
//           )
//         );
//       }
//     );

//     // Add new
//     const newImages = productImages.filter((img) => !img.id);
//     if (newImages.length) {
//       const records = newImages.map((img, i) => ({
//         productId,
//         imageUrl: img.base64 ? Buffer.from(img.base64, "base64") : null,
//         altText: img.altText,
//         isMain: img.isMain || false,
//         sortOrder: i,
//       }));
//       await db.productImage.createMany({ data: records });
//     }

//     // --- Variants (by SKU deterministic mapping) ---
//     const existingVariants = await db.productVariant.findMany({ where: { productId } });
//     const skuMap = new Map(existingVariants.map((v) => [v.sku, v]));

//     const incomingSkus = new Set(variants.map((v) => v.sku));
//     const toDeleteSkus = existingVariants.filter((v) => !incomingSkus.has(v.sku)).map((v) => v.sku);

//     // Delete old variants
//     if (toDeleteSkus.length) {
//       const toDeleteIds = existingVariants
//         .filter((v) => toDeleteSkus.includes(v.sku))
//         .map((v) => v.id);
//       await Promise.all([
//         db.stockMovement.deleteMany({ where: { productVariantId: { in: toDeleteIds } } }),
//         db.inventory.deleteMany({ where: { productVariantId: { in: toDeleteIds } } }),
//         db.productVariant.deleteMany({ where: { id: { in: toDeleteIds } } }),
//       ]);
//     }

//     // --- Upsert variants (create or update by SKU) ---
//     await executeInBatches(variants, 25, async (batch) => {
//       await Promise.all(
//         batch.map((v) =>
//           db.productVariant.upsert({
//             where: { sku: v.sku },
//             create: {
//               productId,
//               sku: v.sku,
//               price: v.price,
//               comparePrice: v.comparePrice,
//               cost: v.cost,
//               stock: v.stock,
//               weight: v.weight,
//               dimensions: v.dimensions,
//               isActive: v.isActive,
//               attributes: v.attributes,
//             },
//             update: {
//               price: v.price,
//               comparePrice: v.comparePrice,
//               cost: v.cost,
//               stock: v.stock,
//               weight: v.weight,
//               dimensions: v.dimensions,
//               isActive: v.isActive,
//               attributes: v.attributes,
//             },
//           })
//         )
//       );
//     });

//     // --- Update inventory + record stock deltas ---
//     const finalVariants = await db.productVariant.findMany({ where: { productId } });
//     const skuToId = new Map(finalVariants.map((v) => [v.sku, v.id]));

//     const inventoryOps: any[] = [];
//     const stockMovements: any[] = [];

//     for (const v of variants) {
//       const variantId = skuToId.get(v.sku);
//       if (!variantId) continue;

//       const oldVariant = skuMap.get(v.sku);
//       const oldQty = oldVariant?.stock ?? 0;
//       const newQty = v.stock ?? 0;
//       const delta = newQty - oldQty;

//       // Inventory upsert
//       inventoryOps.push({
//         productVariantId: variantId,
//         quantity: newQty,
//         reservedQuantity: 0,
//         lowStockThreshold: v.lowStockThreshold,
//         trackInventory: true,
//       });

//       // Only record stock movement if quantity actually changed
//       if (delta !== 0) {
//         stockMovements.push({
//           productVariantId: variantId,
//           type: delta > 0 ? "PURCHASE" : "ADJUSTMENT", // could map to SALE/DAMAGE later
//           quantity: Math.abs(delta),
//           reason: delta > 0 ? "STOCK INCREASE" : "STOCK DECREASE",
//         });
//       }
//     }

//     // Batch inventory
//     await executeInBatches(inventoryOps, 20, async (batch) => {
//       await Promise.all(
//         batch.map((inv) =>
//           db.inventory.upsert({
//             where: { productVariantId: inv.productVariantId },
//             create: inv,
//             update: inv,
//           })
//         )
//       );
//     });

//     // Batch stock movement
//     if (stockMovements.length) {
//       await executeInBatches(stockMovements, 50, async (batch) => {
//         await db.stockMovement.createMany({ data: batch });
//       });
//     }

//     // Success
//     return res.status(200).json({
//       status: true,
//       message: "Product updated successfully",
//       data: updatedProduct,
//     });
//   } catch (error) {
//     console.error("Error updating product:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Failed to update product",
//     });
//   }
// };

// export const listProducts = async (req: Request, res: Response) => {
//   try {
//     const products = await db.product.findMany({
//       include: {
//         images: true,
//       },
//     });

//     const modifiedProducts = products.map((product) => {
//       const modifiedImages = product.images.map((imageObj) => ({
//         ...imageObj,
//         imageUrl: imageObj?.imageUrl
//           ? `data:image/jpeg;base64,${Buffer.from(imageObj.imageUrl).toString("base64")}`
//           : null,
//       }));
//       return { ...product, images: modifiedImages };
//     });

//     return res.status(200).json({
//       status: true,
//       message: "Products retrieved successfully",
//       products: modifiedProducts,
//     });
//   } catch (error) {
//     console.error("Error retrieving products:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

export const listProducts = async (req: Request, res: Response) => {
  try {
    // --- Query params ---
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "createdAt",
      order = "desc",
      categoryId,
      brandId,
      status = "ACTIVE",
    } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // --- Build dynamic filter ---
    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...(brandId && { brandId: Number(brandId) }),
      ...(status && { status }),
    };

    // --- Query in parallel ---
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          basePrice: true,
          // brand: { select: { id: true, brandName: true } },
          // category: { select: { id: true, categoryName: true } },
          // images: {
          //   select: {
          //     id: true,
          //     altText: true,
          //     isMain: true,
          //     imageUrl: true, // assume this is a URL or lightweight reference
          //   },
          //   take: 3, // limit images per product
          // },
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.product.count({ where }),
    ]);

    // --- Transform for client ---
    // const modifiedProducts = products.map((product) => ({
    //   ...product,
    //   images: product.images.map((img) => ({
    //     ...img,
    //     imageUrl:
    //       img.imageUrl instanceof Buffer
    //         ? `data:image/jpeg;base64,${img.imageUrl.toString("base64")}`
    //         : img.imageUrl,
    //   })),
    // }));

    return res.status(200).json({
      status: true,
      message: "Products retrieved successfully",
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      data: products,
    });
  } catch (error) {
    console.error("❌ Error retrieving products:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const getAProduct = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role } = user;

  const productId = Number(req.params.productId);

  if (Number.isNaN(productId)) {
    return res.status(400).json({
      status: false,
      message: "Product ID must be a valid number",
    });
  }

  try {
    const dbUser = await db.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const existingProduct = await db.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        images: true,
      },
    });

    console.log("existing product", existingProduct);

    if (!existingProduct) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    //modified product
    const modifiedProduct = {
      ...existingProduct,
      images: existingProduct.images.map((img) => ({
        ...img,
        imageUrl: img?.imageUrl
          ? `data:image/jpeg;base64,${Buffer.from(img.imageUrl).toString("base64")}`
          : null,
      })),
    };

    console.log("modified product", modifiedProduct);

    return res.status(200).json({
      status: true,
      message: "Product fetched successfully",
      data: modifiedProduct,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const softDeleteAProduct = async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role } = user;

  // Role check
  if (role !== "ADMIN") {
    return res
      .status(403)
      .json({ status: false, message: "User is not an admin" });
  }

  // Validate product ID
  const productId = Number(req.params.productId);
  if (Number.isNaN(productId)) {
    return res.status(400).json({
      status: false,
      message: "Product ID must be a valid number",
    });
  }

  try {
    // Check user existence
    const dbUser = await db.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Fetch product with variants
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!existingProduct) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    const variantIds = existingProduct.variants.map((v) => v.id);

    await db.$transaction(async (tx) => {
      // Mark variants as inactive
      if (variantIds.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: variantIds } },
          data: { isActive: false },
        });
      }

      // Mark product as inactive
      await tx.product.update({
        where: { id: productId },
        data: { status: "INACTIVE" },
      });
    });

    return res.status(200).json({
      status: true,
      message: "Product marked as inactive (soft deleted) successfully",
    });
  } catch (error) {
    console.error("Error soft deleting product:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const deleteAProductPermanently = async (
  req: Request,
  res: Response
) => {
  const { user } = req as AuthenticatedRequest;
  const { id: userId, role } = user;

  // Role check
  if (role !== "ADMIN") {
    return res
      .status(403)
      .json({ status: false, message: "User is not an admin" });
  }

  // Validate product ID
  const productId = Number(req.params.productId);
  if (Number.isNaN(productId)) {
    return res.status(400).json({
      status: false,
      message: "Product ID must be a valid number",
    });
  }

  try {
    // Check user existence
    const dbUser = await db.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Fetch product with variants
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!existingProduct) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    const variantIds = existingProduct.variants.map((v) => v.id);

    await db.$transaction(async (tx) => {
      if (variantIds.length > 0) {
        // Delete stock movements linked to variants
        await tx.stockMovement.deleteMany({
          where: { productVariantId: { in: variantIds } },
        });

        // Delete inventory linked to variants
        await tx.inventory.deleteMany({
          where: { productVariantId: { in: variantIds } },
        });

        // Delete the variants
        await tx.productVariant.deleteMany({
          where: { id: { in: variantIds } },
        });
      }

      // Delete images linked to the product
      await tx.productImage.deleteMany({ where: { productId } });

      // Delete the product itself
      await tx.product.delete({ where: { id: productId } });
    });

    return res.status(200).json({
      status: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
