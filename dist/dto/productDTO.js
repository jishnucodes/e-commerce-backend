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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    return {
        id: (_a = productObj.id) !== null && _a !== void 0 ? _a : 0,
        name: (_b = productObj.name) !== null && _b !== void 0 ? _b : '',
        description: (_c = productObj.description) !== null && _c !== void 0 ? _c : '',
        slug: (_d = productObj.slug) !== null && _d !== void 0 ? _d : '',
        status: (_e = productObj.status) !== null && _e !== void 0 ? _e : ProductStatus.ACTIVE,
        brandId: (_f = productObj.brandId) !== null && _f !== void 0 ? _f : 0,
        categoryId: (_g = productObj.categoryId) !== null && _g !== void 0 ? _g : 0,
        subCategoryId: (_h = productObj.subCategoryId) !== null && _h !== void 0 ? _h : 0,
        metaTitle: (_j = productObj.metaTitle) !== null && _j !== void 0 ? _j : '',
        metaDescription: (_k = productObj.metaDescription) !== null && _k !== void 0 ? _k : '',
        basePrice: (_l = productObj.basePrice) !== null && _l !== void 0 ? _l : 0,
        productImages: (_m = productObj.productImages) !== null && _m !== void 0 ? _m : [],
        sortOrder: (_o = productObj.sortOrder) !== null && _o !== void 0 ? _o : 0,
        isMain: (_p = productObj.isMain) !== null && _p !== void 0 ? _p : false,
        lowStockThreshold: (_q = productObj.lowStockThreshold) !== null && _q !== void 0 ? _q : 0,
        variants: ((_r = productObj.variants) !== null && _r !== void 0 ? _r : []).map(variant => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            return ({
                id: (_a = variant.id) !== null && _a !== void 0 ? _a : 0,
                productId: (_b = variant.productId) !== null && _b !== void 0 ? _b : 0,
                sku: (_c = variant.sku) !== null && _c !== void 0 ? _c : '',
                price: (_d = variant.price) !== null && _d !== void 0 ? _d : 0,
                comparePrice: (_e = variant.comparePrice) !== null && _e !== void 0 ? _e : 0,
                cost: (_f = variant.cost) !== null && _f !== void 0 ? _f : 0,
                stock: (_g = variant.stock) !== null && _g !== void 0 ? _g : 0,
                weight: (_h = variant.weight) !== null && _h !== void 0 ? _h : 0.00,
                dimensions: (_j = variant.dimensions) !== null && _j !== void 0 ? _j : '',
                isActive: (_k = variant.isActive) !== null && _k !== void 0 ? _k : false,
                attributes: (_l = variant.attributes) !== null && _l !== void 0 ? _l : [],
                lowStockThreshold: (_m = variant.lowStockThreshold) !== null && _m !== void 0 ? _m : 0,
                stockMovementType: (_o = variant.stockMovementType) !== null && _o !== void 0 ? _o : StockMovementType.PURCHASE
            });
        })
    };
};
exports.buildProductDTO = buildProductDTO;
//# sourceMappingURL=productDTO.js.map