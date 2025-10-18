type VariantAttribute = {
  name: string;
  value: string;
};


type DimensionAttribute = {
    property: string;
    value: string | number
}

enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED'
}

enum StockMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE'
}

type VariantDTO = {
    id: number;
    productId: number;
    sku: string;
    price: number;
    comparePrice: number;
    cost: number;
    stock: number;
    weight: number;
    dimensions: DimensionAttribute[];
    isActive: boolean;
    attributes: VariantAttribute[],
    lowStockThreshold: number,
    stockMovementType: StockMovementType

}



type ProductImageDTO = {
    id: number;
    base64: string;
    altText: string;
    isMain: boolean;
}

type ProductDTO = {
    id: number;
    name: string;
    description: string;
    slug: string;
    status: ProductStatus;
    brandId: number;
    categoryId: number;
    metaTitle: string;
    metaDescription: string;
    basePrice: number;
    productImages: ProductImageDTO[];
    sortOrder: number;
    isMain: boolean;
    variants: VariantDTO[];
    lowStockThreshold: number;

}

export const buildProductDTO = (productObj: Partial<ProductDTO>): ProductDTO => {
  return {
    id: productObj.id ?? 0,
    name: productObj.name ?? '',
    description: productObj.description ?? '',
    slug: productObj.slug ?? '',
    status: productObj.status ?? ProductStatus.ACTIVE,
    brandId: productObj.brandId ?? 0,
    categoryId: productObj.categoryId ?? 0,
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
