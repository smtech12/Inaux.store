// Order Track API Response Models
export interface OrderTrackResponse {
  sale: OrderSaleInfo;
  details: OrderDetailDTO[];
}

export interface OrderSaleInfo {
  id: number;
  transactionNumber: string;
  netTotal: number;
  discountAmount: number;
  additionalDiscount: number;
  createdBy: string;
  status: string;
  customerId: number;
  customerName: string;
  phoneNumber: string;
  email?: string | null;
  createdDate: string;
  remarks: string | null;
}

export interface OrderDetailDTO {
  saleDetailId: number;
  saleid: number;
  sku: string;
  productName: string;
  unitPrice: number;
  discountPercentage: number;
  quantity: number;
  discountAmount: number;
  totalPrice: number;
  description: string | null;
  imageUrl?: string | null;
  images?: string[]; // Array of product images from API
}

// Legacy Order History DTO (for backward compatibility)
export interface OrderHistoryDTO {
  saleid: number;
  transactionNumber: string;
  saleDate: string;
  status: string;
  type: string;
  totalAmount: number;
  discountAmount: number;
  netTotal: number;
  isFeedbackGiven: number;
  details: OrderDetailDTO[];
}

