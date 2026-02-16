// API Response Models
export interface ApiResponseMessage<T = any> {
  date: string;
  statusCode: number;
  message: string;
  successData?: T;
  errorData?: string;
}

export interface ProductImageDTO {
  id: number;
  sku: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface ProductListDTO {
  id: number;
  productName: string;
  description?: string;
  categoryName: string;
  sku: string;
  sellingPrice: number;
  discount: number;
  priceAfterDiscount: number;
  stockStatus: string;
  images: ProductImageDTO[];
  isVariable?: boolean;
  variantId?: number | null;
  categoryId?: number;
}

// WebSection DTOs
export interface WebSectionItemDto {
  id: number;
  webSectionId?: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  redirectUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface WebSectionDto {
  id: number;
  sectionName: string;
  sectionKey?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  items: WebSectionItemDto[];
}

// Get Section API Response Structure
export interface GetSectionResponseDto {
  totalSections: number;
  sections: WebSectionDto[];
}

// Category DTOs
export interface CategoryDTO {
  id: number;
  categoryName: string;
  image: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
}


