import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { IProduct } from '../types/product-d-t';

const state = {
  wishlists: JSON.parse(localStorage['wishlist_products'] || '[]') as IProduct[]
}

@Injectable({
  providedIn: 'root'
})


export class WishlistService {

  constructor(private toastrService: ToastrService) { }

  public getWishlistProducts () {
    return state.wishlists;
  }

  // add_wishlist_product
  // Saves product details same as cart: variantId, sku, selectedAttributes, attributeNames, priceAfterDiscount
  add_wishlist_product(payload: IProduct, variantId?: number) {
    // Use variantId from payload if provided, otherwise use the parameter
    const finalVariantId = payload.variantId !== undefined ? payload.variantId : variantId;
    
    // Check if item exists - compare by product ID and variant ID (and optionally SKU)
    const isAdded = state.wishlists.findIndex((p: IProduct) => {
      const sameProduct = p.id === payload.id;
      const sameVariant = (p.variantId || null) === (finalVariantId || null);
      // Also check SKU if available for more precise matching
      const sameSku = payload.sku ? (p.sku === payload.sku) : true;
      return sameProduct && sameVariant && sameSku;
    });

    if (isAdded !== -1) {
      state.wishlists = state.wishlists.filter((p: IProduct) => {
        const sameProduct = p.id === payload.id;
        const sameVariant = (p.variantId || null) === (finalVariantId || null);
        const sameSku = payload.sku ? (p.sku === payload.sku) : true;
        return !(sameProduct && sameVariant && sameSku);
      });
      // Toast message removed as per user request
    } else {
      // Save product with all details same as cart
      const newItem: IProduct = {
        ...payload,
        // Persist variant information on the wishlist item
        variantId: finalVariantId,
        sku: payload.sku || payload.sku, // Use SKU from payload
        selectedAttributes: payload.selectedAttributes || undefined, // Store selected attributes
        attributeNames: payload.attributeNames || undefined, // Store attribute names
        priceAfterDiscount: payload.priceAfterDiscount || undefined, // Store price after discount
        // Explicitly preserve quantity and status to prevent out-of-stock issues
        // If quantity is 0 or undefined, set to a default value (999) to prevent "out of stock" error
        // The actual stock check should be done when fetching fresh product data
        quantity: (payload.quantity !== undefined && payload.quantity !== null && payload.quantity > 0) ? payload.quantity : 999,
        status: payload.status || 'in-stock', // Preserve status field, default to 'in-stock' if missing
      };
      state.wishlists.push(newItem);
      this.toastrService.success(`${payload.title} added to wishlist`);
    }
    localStorage.setItem("wishlist_products", JSON.stringify(state.wishlists));
  };
  // removeWishlist
  removeWishlist(payload: IProduct) {
    // Remove by product ID, variant ID, and SKU (same matching logic as add)
    const finalVariantId = payload.variantId !== undefined ? payload.variantId : undefined;
    state.wishlists = state.wishlists.filter((p: IProduct) => {
      const sameProduct = p.id === payload.id;
      const sameVariant = (p.variantId || null) === (finalVariantId || null);
      const sameSku = payload.sku ? (p.sku === payload.sku) : true;
      return !(sameProduct && sameVariant && sameSku);
    });
    // Toast message removed as per user request
    localStorage.setItem("wishlist_products", JSON.stringify(state.wishlists));
  };

  /**
   * Update existing wishlist item with variant details
   * @param productId Product ID
   * @param updatedProduct Updated product with variant details
   */
  updateWishlistItem(productId: number, updatedProduct: IProduct): void {
    const itemIndex = state.wishlists.findIndex((item: IProduct) => item.id === productId);
    if (itemIndex !== -1) {
      // Update the existing item with variant details
      state.wishlists[itemIndex] = {
        ...state.wishlists[itemIndex],
        ...updatedProduct,
        // Preserve quantity if not provided in updated product
        quantity: updatedProduct.quantity !== undefined ? updatedProduct.quantity : state.wishlists[itemIndex].quantity,
      };
      localStorage.setItem("wishlist_products", JSON.stringify(state.wishlists));
    }
  };
}
