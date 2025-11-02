"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProductDTO = void 0;
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["INACTIVE"] = "INACTIVE";
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
})(ProductStatus || (ProductStatus = {}));
var StockMovementType;
(function (StockMovementType) {
    StockMovementType["PURCHASE"] = "PURCHASE";
    StockMovementType["SALE"] = "SALE";
    StockMovementType["ADJUSTMENT"] = "ADJUSTMENT";
    StockMovementType["RETURN"] = "RETURN";
    StockMovementType["DAMAGE"] = "DAMAGE";
})(StockMovementType || (StockMovementType = {}));
const buildProductDTO = (productObj) => {
    return {
        id: productObj.id ?? 0,
        name: productObj.name ?? '',
        description: productObj.description ?? '',
        slug: productObj.slug ?? '',
        status: productObj.status ?? ProductStatus.ACTIVE,
        brandId: productObj.brandId ?? 0,
        categoryId: productObj.categoryId ?? 0,
        subCategoryId: productObj.subCategoryId ?? 0,
        metaTitle: productObj.metaTitle ?? '',
        metaDescription: productObj.metaDescription ?? '',
        basePrice: productObj.basePrice ?? 0,
        productImages: productObj.productImages ?? [],
        sortOrder: productObj.sortOrder ?? 0,
        isMain: productObj.isMain ?? false,
        lowStockThreshold: productObj.lowStockThreshold ?? 0,
        // variants fallback to empty array and normalize each one
        variants: (productObj.variants ?? []).map(variant => ({
            id: variant.id ?? 0,
            productId: variant.productId ?? 0,
            sku: variant.sku ?? '',
            price: variant.price ?? 0,
            comparePrice: variant.comparePrice ?? 0,
            cost: variant.cost ?? 0,
            stock: variant.stock ?? 0,
            weight: variant.weight ?? 0.00,
            dimensions: variant.dimensions ?? '',
            isActive: variant.isActive ?? false,
            attributes: variant.attributes ?? [],
            lowStockThreshold: variant.lowStockThreshold ?? 0,
            stockMovementType: variant.stockMovementType ?? StockMovementType.PURCHASE
        }))
    };
};
exports.buildProductDTO = buildProductDTO;
