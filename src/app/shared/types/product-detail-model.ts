// Product Detail API Response Models
import { ProductImageDTO } from './product-list-model';

export interface ProductDetailDTO {
  id: number;
  productName: string;
  description: string;
  sku: string;
  categoryId?: number;
  categoryName: string;
  brandName: string;
  sellingPrice: number;
  discount: number;
  priceAfterDiscount: number;
  stockUnits: number;
  stockQuantity: number;
  stockStatus: string;
  images: ProductImageDTO[];
  isVariable: boolean;
  variantSequence: string | null;
  currentVariantAttributes: VariantAttributeDTO[];
  attributes: ProductAttributeDTO[];
  variants: VariantDTO[] | null;
  averageRating: number;
  reviewCount: number;
  reviews: ReviewDTO[];
}

export interface VariantDTO {
  variantId: number;
  sku: string;
  sequence: string | null;
  price: number;
  costPrice: number;
  isDefault: boolean;
  attributes: VariantAttributeDTO[];
  images: ProductImageDTO[];
  stockUnits?: number;
  stockQuantity?: number;
  stockStatus?: string;
}

export interface VariantAttributeDTO {
  attributeId: number;
  attributeName?: string;
  attributeValue: string;
}

export interface ProductAttributeDTO {
  attributeId: number;
  attributeName?: string;
  attributeValues: string[];
}

export interface ReviewDTO {
  customerName: string;
  rating: number;
  remarks: string;
  reviewDate: string;
}


