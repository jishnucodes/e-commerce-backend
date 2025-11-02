"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAProductPermanently = exports.softDeleteAProduct = exports.getAProductBySlug = exports.listProductsByCategoryORSubCategorySlug = exports.listProducts = exports.updateProduct = exports.createProduct = void 0;
const prisma_1 = require("../lib/prisma");
const productDTO_1 = require("../dto/productDTO");
async function retry(fn, retries = 3, delay = 300) {
    try {
        return await fn();
    }
    catch (err) {
        if (retries > 0 && (err.code === "P1001" || err.code === "P2028")) {
            console.warn(`⚠️ Retrying Prisma op... ${retries} left`);
            await new Promise((r) => setTimeout(r, delay));
            return retry(fn, retries - 1, delay * 2);
        }
        throw err;
    }
}
async function executeInBatches(items, batchSize, fn) {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await fn(batch);
    }
}
async function rollbackProduct(productId) {
    await prisma_1.db.stockMovement.deleteMany({
        where: { productVariant: { productId } },
    });
    await prisma_1.db.inventory.deleteMany({
        where: { productVariant: { productId } },
    });
    await prisma_1.db.productVariant.deleteMany({ where: { productId } });
    await prisma_1.db.productImage.deleteMany({ where: { productId } });
    await prisma_1.db.product.delete({ where: { id: productId } });
}
const createProduct = async (req, res) => {
    var _a, _b;
    const { user } = req;
    const { id: userId, role } = user;
    if (role !== "ADMIN")
        return res
            .status(403)
            .json({ status: false, message: "User is not admin" });
    const productObj = (0, productDTO_1.buildProductDTO)(req.body);
    const variants = productObj.variants || [];
    const productImages = productObj.productImages || [];
    try {
        const [dbUser, existingBrand, existingCategory] = await Promise.all([
            prisma_1.db.user.findUnique({ where: { id: userId } }),
            prisma_1.db.brand.findUnique({ where: { id: productObj.brandId } }),
            prisma_1.db.category.findUnique({ where: { id: productObj.categoryId } }),
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
        const createdProduct = await prisma_1.db.$transaction(async (tx) => {
            var _a, _b;
            const product = await tx.product.create({
                data: {
                    name: productObj.name,
                    description: productObj.description,
                    slug: productObj.slug,
                    status: productObj.status,
                    brandId: productObj.brandId,
                    categoryId: productObj.categoryId,
                    subCategoryId: productObj.subCategoryId,
                    metaTitle: productObj.metaTitle,
                    metaDescription: productObj.metaDescription,
                    basePrice: productObj.basePrice,
                    createdBy: userId,
                    modifiedBy: userId,
                },
            });
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
            const createdVariants = await Promise.all(variantRecords.map((v) => tx.productVariant.create({ data: v })));
            const inventoryRecords = [];
            const movementRecords = [];
            for (let i = 0; i < createdVariants.length; i++) {
                const variant = createdVariants[i];
                const sourceVariant = variants[i];
                const initial = (_a = sourceVariant.stock) !== null && _a !== void 0 ? _a : 0;
                inventoryRecords.push({
                    productVariantId: variant.id,
                    quantity: initial,
                    reservedQuantity: 0,
                    lowStockThreshold: (_b = sourceVariant.lowStockThreshold) !== null && _b !== void 0 ? _b : 0,
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
        return res.status(201).json({
            status: true,
            message: "Product created successfully",
            data: { id: createdProduct.id },
        });
    }
    catch (error) {
        console.error("Error creating product:", error);
        if (error.code === "P2002") {
            return res.status(400).json({
                status: false,
                message: `Duplicate entry: ${(_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.join(", ")}`,
            });
        }
        return res
            .status(500)
            .json({ status: false, message: "Failed to create product" });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    var _a, _b;
    const { user } = req;
    const { id: userId, role } = user;
    if (role !== "ADMIN")
        return res
            .status(403)
            .json({ status: false, message: "User is not admin" });
    const productId = parseInt(req.params.productId);
    const productObj = (0, productDTO_1.buildProductDTO)(req.body);
    const variants = productObj.variants || [];
    const productImages = productObj.productImages || [];
    try {
        const [dbUser, existingProduct, existingBrand, existingCategory] = await Promise.all([
            prisma_1.db.user.findUnique({ where: { id: userId } }),
            prisma_1.db.product.findUnique({ where: { id: productId } }),
            prisma_1.db.brand.findUnique({ where: { id: productObj.brandId } }),
            prisma_1.db.category.findUnique({ where: { id: productObj.categoryId } }),
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
        const updatedProduct = await prisma_1.db.$transaction(async (tx) => {
            var _a, _b, _c, _d;
            const product = await tx.product.update({
                where: { id: productId },
                data: {
                    name: productObj.name,
                    description: productObj.description,
                    slug: productObj.slug,
                    status: productObj.status,
                    brandId: productObj.brandId,
                    categoryId: productObj.categoryId,
                    subCategoryId: productObj.subCategoryId,
                    metaTitle: productObj.metaTitle,
                    metaDescription: productObj.metaDescription,
                    basePrice: productObj.basePrice,
                    modifiedBy: userId,
                },
            });
            const existingImages = await tx.productImage.findMany({
                where: { productId },
            });
            const existingImageIds = existingImages.map((img) => String(img.id));
            const incomingImages = productImages || [];
            const validExistingImages = incomingImages.filter((img) => img.id && existingImageIds.includes(String(img.id)));
            const newImages = incomingImages.filter((img) => !img.id || !existingImageIds.includes(String(img.id)));
            const incomingValidIds = validExistingImages.map((i) => String(i.id));
            const toDelete = existingImageIds.filter((id) => !incomingValidIds.includes(id));
            if (toDelete.length) {
                await tx.productImage.deleteMany({
                    where: { id: { in: toDelete.map((id) => Number(id)) } },
                });
            }
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
            const existingVariants = await tx.productVariant.findMany({
                where: { productId },
            });
            const existingSkuMap = new Map(existingVariants.map((v) => [v.sku, v]));
            const incomingSkus = new Set(variants.map((v) => v.sku));
            const toDeleteSkus = existingVariants
                .filter((v) => !incomingSkus.has(v.sku))
                .map((v) => v.sku);
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
            const finalVariants = await tx.productVariant.findMany({
                where: { productId },
            });
            const skuToId = new Map(finalVariants.map((v) => [v.sku, v.id]));
            const inventoryRecords = [];
            const movementRecords = [];
            for (const v of variants) {
                const variantId = skuToId.get(v.sku);
                if (!variantId)
                    continue;
                const oldStock = (_b = (_a = existingSkuMap.get(v.sku)) === null || _a === void 0 ? void 0 : _a.stock) !== null && _b !== void 0 ? _b : 0;
                const newStock = (_c = v.stock) !== null && _c !== void 0 ? _c : 0;
                const delta = newStock - oldStock;
                inventoryRecords.push({
                    productVariantId: variantId,
                    quantity: newStock,
                    reservedQuantity: 0,
                    lowStockThreshold: (_d = v.lowStockThreshold) !== null && _d !== void 0 ? _d : 0,
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
            for (const inv of inventoryRecords) {
                await tx.inventory.upsert({
                    where: { productVariantId: inv.productVariantId },
                    create: inv,
                    update: inv,
                });
            }
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
    }
    catch (error) {
        console.error("Error updating product:", error);
        if (error.code === "P2002") {
            return res.status(400).json({
                status: false,
                message: `Duplicate entry: ${(_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.join(", ")}`,
            });
        }
        return res.status(500).json({
            status: false,
            message: "Failed to update product",
        });
    }
};
exports.updateProduct = updateProduct;
const listProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = "", sortBy = "createdAt", order = "desc", categoryId, brandId, status = "ACTIVE", slug } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {
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
            ...(slug && { slug: { contains: slug, mode: "insensitive" } }),
        };
        const [products, total] = await Promise.all([
            prisma_1.db.product.findMany({
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
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma_1.db.product.count({ where }),
        ]);
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
    }
    catch (error) {
        console.error("❌ Error retrieving products:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.listProducts = listProducts;
const listProductsByCategoryORSubCategorySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const category = await prisma_1.db.category.findUnique({
            where: { slug },
        });
        const subCategory = category
            ? null
            : await prisma_1.db.subCategory.findUnique({
                where: { slug },
            });
        if (!category && !subCategory) {
            return res.status(404).json({
                status: false,
                message: "Category or Subcategory not found",
            });
        }
        const whereCondition = category
            ? { categoryId: category.id }
            : { subCategoryId: subCategory.id };
        const products = await prisma_1.db.product.findMany({
            where: whereCondition,
            include: { images: true, variants: true },
        });
        if (!products || products.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No products found for this slug",
            });
        }
        const modifiedProducts = products.map((product) => ({
            ...product,
            images: product.images.map((img) => ({
                ...img,
                imageUrl: (img === null || img === void 0 ? void 0 : img.imageUrl)
                    ? `data:image/jpeg;base64,${Buffer.from(img.imageUrl).toString("base64")}`
                    : null,
            })),
        }));
        return res.status(200).json({
            status: true,
            message: "Products retrieved successfully",
            data: modifiedProducts,
        });
    }
    catch (error) {
        console.error("Error retrieving products:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.listProductsByCategoryORSubCategorySlug = listProductsByCategoryORSubCategorySlug;
const getAProductBySlug = async (req, res) => {
    const { user } = req;
    const { slug } = req.params;
    try {
        const existingProduct = await prisma_1.db.product.findUnique({
            where: { slug },
            include: {
                variants: {
                    include: {
                        inventory: true
                    }
                },
                images: true,
            },
        });
        if (!existingProduct) {
            return res
                .status(404)
                .json({ status: false, message: "Product not found" });
        }
        const modifiedProduct = {
            ...existingProduct,
            images: existingProduct.images.map((img) => ({
                ...img,
                imageUrl: (img === null || img === void 0 ? void 0 : img.imageUrl)
                    ? `data:image/jpeg;base64,${Buffer.from(img.imageUrl).toString("base64")}`
                    : null,
            })),
        };
        return res.status(200).json({
            status: true,
            message: "Product fetched successfully",
            data: modifiedProduct,
        });
    }
    catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.getAProductBySlug = getAProductBySlug;
const softDeleteAProduct = async (req, res) => {
    const { user } = req;
    const { id: userId, role } = user;
    if (role !== "ADMIN") {
        return res
            .status(403)
            .json({ status: false, message: "User is not an admin" });
    }
    const productId = Number(req.params.productId);
    if (Number.isNaN(productId)) {
        return res.status(400).json({
            status: false,
            message: "Product ID must be a valid number",
        });
    }
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: userId } });
        if (!dbUser) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const existingProduct = await prisma_1.db.product.findUnique({
            where: { id: productId },
            include: { variants: true },
        });
        if (!existingProduct) {
            return res
                .status(404)
                .json({ status: false, message: "Product not found" });
        }
        const variantIds = existingProduct.variants.map((v) => v.id);
        await prisma_1.db.$transaction(async (tx) => {
            if (variantIds.length > 0) {
                await tx.productVariant.updateMany({
                    where: { id: { in: variantIds } },
                    data: { isActive: false },
                });
            }
            await tx.product.update({
                where: { id: productId },
                data: { status: "INACTIVE" },
            });
        });
        return res.status(200).json({
            status: true,
            message: "Product marked as inactive (soft deleted) successfully",
        });
    }
    catch (error) {
        console.error("Error soft deleting product:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.softDeleteAProduct = softDeleteAProduct;
const deleteAProductPermanently = async (req, res) => {
    const { user } = req;
    const { id: userId, role } = user;
    if (role !== "ADMIN") {
        return res
            .status(403)
            .json({ status: false, message: "User is not an admin" });
    }
    const productId = Number(req.params.productId);
    if (Number.isNaN(productId)) {
        return res.status(400).json({
            status: false,
            message: "Product ID must be a valid number",
        });
    }
    try {
        const dbUser = await prisma_1.db.user.findUnique({ where: { id: userId } });
        if (!dbUser) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const existingProduct = await prisma_1.db.product.findUnique({
            where: { id: productId },
            include: { variants: true },
        });
        if (!existingProduct) {
            return res
                .status(404)
                .json({ status: false, message: "Product not found" });
        }
        const variantIds = existingProduct.variants.map((v) => v.id);
        await prisma_1.db.$transaction(async (tx) => {
            if (variantIds.length > 0) {
                await tx.stockMovement.deleteMany({
                    where: { productVariantId: { in: variantIds } },
                });
                await tx.inventory.deleteMany({
                    where: { productVariantId: { in: variantIds } },
                });
                await tx.productVariant.deleteMany({
                    where: { id: { in: variantIds } },
                });
            }
            await tx.productImage.deleteMany({ where: { productId } });
            await tx.product.delete({ where: { id: productId } });
        });
        return res.status(200).json({
            status: true,
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
exports.deleteAProductPermanently = deleteAProductPermanently;
//# sourceMappingURL=productController.js.map