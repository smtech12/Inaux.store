export interface IProduct {
    id: number;
    // Optional variant identifier (for variable products)
    variantId?: number;
    // SKU of the selected variant
    sku?: string;
    // Selected attribute values (e.g., { "2": "Off White", "3": "21.5" } for Color and Size)
    selectedAttributes?: { [key: number | string]: string };
    // Attribute names mapping (e.g., { "2": "Color", "3": "Size" })
    attributeNames?: { [key: number | string]: string };
    // Indicates if product has variants (from API)
    isVariable?: boolean;
    img: string;
    trending?: boolean;
    topRated?: boolean;
    bestSeller?: boolean;
    new?: boolean;
    banner?: boolean;
    price:number;
    old_price?:number;
    discount?:number;
    rating?:number;
    status?:string;
    quantity:number;
    related_images: string[];
    orderQuantity?: number;
    sizes: string[];
    weight?: number;
    dimension?: string;
    big_img?: string;
    colors: string[];
    thumb_img: string;
    sm_desc: string;
    banner_img?: string;
    parentCategory: string;
    category: string;
    brand: string;
    title: string;
    // Full product description from API
    description?: string;
    // Optional computed price after discount - can be stored in cart if needed
    priceAfterDiscount?: number;
    // Stock-related properties
    stockUnits?: number;
    stockQuantity?: number;
    stockStatus?: string;
    details: {
      details_text: string;
      details_list: string[];
      details_text_2: string;
  };
  reviews:{
    img: string;
    name: string;
    time: string;
    rating: number;
    review_desc: string;
  }[]
}
