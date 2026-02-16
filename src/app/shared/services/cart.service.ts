import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { IProduct } from '../types/product-d-t';

const state = {
  cart_products: JSON.parse(localStorage['cart_products'] || '[]') as IProduct[]
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  public orderQuantity: number = 1;
  public isCartOpen: boolean = false;
  private cartCloseTimer: any;

  constructor(private toastrService: ToastrService) { }

  public getCartProducts(): IProduct[] {
    return state.cart_products;
  }

  handleOpenCartSidebar() {
    this.isCartOpen = !this.isCartOpen
  }

  // add_cart_product
  // Optional variantId allows distinguishing different variants of the same product
  // Optional openSidebar controls whether to open the cart sidebar (default: true)
  // The payload should already contain variantId, sku, and selectedAttributes if applicable
  addCartProduct(payload: IProduct, variantId?: number, openSidebar: boolean = true) {
    // Use variantId from payload if provided, otherwise use the parameter
    const finalVariantId = payload.variantId !== undefined ? payload.variantId : variantId;

    // Check if item exists - compare by product ID and variant ID (and optionally SKU)
    const isExist = state.cart_products.some(
      (i: IProduct) => {
        const sameProduct = i.id === payload.id;
        const sameVariant = (i.variantId || null) === (finalVariantId || null);
        // Also check SKU if available for more precise matching
        const sameSku = payload.sku ? (i.sku === payload.sku) : true;
        return sameProduct && sameVariant && sameSku;
      }
    );

    if (payload.status === 'out-of-stock' || payload.quantity === 0) {
      this.toastrService.error(`Out of stock ${payload.title}`);
    }
    else if (!isExist) {
      const newItem: IProduct = {
        ...payload,
        orderQuantity: this.orderQuantity, // Use the selected quantity from cart service
        // Persist variant information on the cart line
        variantId: finalVariantId,
        sku: payload.sku || payload.sku, // Use SKU from payload
        selectedAttributes: payload.selectedAttributes || undefined, // Store selected attributes
        attributeNames: payload.attributeNames || undefined, // Store attribute names
      };
      state.cart_products.push(newItem);
      this.toastrService.success(`${this.orderQuantity} ${payload.title} added to cart`);
      // Reset quantity to 1 after adding
      this.orderQuantity = 1;
      // Open cart sidebar after adding product (only if openSidebar is true)
      if (openSidebar) {
        if (!this.isCartOpen) {
          this.handleOpenCartSidebar();
        }

        // Clear existing timer if any
        if (this.cartCloseTimer) {
          clearTimeout(this.cartCloseTimer);
        }

        // Auto close after 3 seconds
        this.cartCloseTimer = setTimeout(() => {
          if (this.isCartOpen) {
            this.isCartOpen = false;
          }
        }, 3000);
      }
    } else {
      state.cart_products.map((item: IProduct) => {
        const sameProduct = item.id === payload.id;
        const sameVariant = (item.variantId || null) === (finalVariantId || null);
        const sameSku = payload.sku ? (item.sku === payload.sku) : true;

        if (sameProduct && sameVariant && sameSku) {
          if (typeof item.orderQuantity !== "undefined") {
            if (item.quantity >= item.orderQuantity + this.orderQuantity) {
              item.orderQuantity =
                this.orderQuantity !== 1
                  ? this.orderQuantity + item.orderQuantity
                  : item.orderQuantity + 1;
              this.toastrService.success(`${this.orderQuantity} ${item.title} added to cart`);
              // Open cart sidebar after adding product (only if openSidebar is true)
              // Open cart sidebar after adding product (only if openSidebar is true)
              if (openSidebar) {
                if (!this.isCartOpen) {
                  this.handleOpenCartSidebar();
                }

                // Clear existing timer if any
                if (this.cartCloseTimer) {
                  clearTimeout(this.cartCloseTimer);
                }

                // Auto close after 3 seconds
                this.cartCloseTimer = setTimeout(() => {
                  if (this.isCartOpen) {
                    this.isCartOpen = false;
                  }
                }, 3000);
              }
            } else {
              this.toastrService.success(`No more quantity available for this product!`);
              this.orderQuantity = 1;
            }
          }
        }
        return { ...item };
      });
    }
    localStorage.setItem("cart_products", JSON.stringify(state.cart_products));
  };

  // total price quantity
  public totalPriceQuantity() {
    return state.cart_products.reduce(
      (cartTotal: { total: number; quantity: number }, cartItem: IProduct) => {
        const { price, orderQuantity, discount, priceAfterDiscount } = cartItem;
        if (typeof orderQuantity !== "undefined") {
          // Use priceAfterDiscount if available, otherwise calculate from price and discount
          let itemPrice: number;
          if (priceAfterDiscount !== undefined && priceAfterDiscount > 0) {
            itemPrice = priceAfterDiscount;
          } else if (discount && discount > 0) {
            // Calculate the item price with discount
            itemPrice = price - (price * discount) / 100;
          } else {
            // Use regular price
            itemPrice = price;
          }

          // Calculate total for this item: price * quantity
          const itemTotal = itemPrice * orderQuantity;
          cartTotal.total += itemTotal;
          cartTotal.quantity += orderQuantity;
        }
        return cartTotal;
      },
      {
        total: 0,
        quantity: 0,
      }
    );
  };

  /**
   * Calculate total discount amount across all cart items
   */
  public totalDiscount(): number {
    return state.cart_products.reduce(
      (totalDiscount: number, cartItem: IProduct) => {
        const { price, orderQuantity, discount } = cartItem;
        if (typeof orderQuantity !== "undefined" && discount && discount > 0) {
          // Calculate discount: (price * discount / 100) * quantity
          const discountPerUnit = (price * discount) / 100;
          totalDiscount += discountPerUnit * orderQuantity;
        }
        return totalDiscount;
      },
      0
    );
  };


  // quantity increment
  increment() {
    return this.orderQuantity = this.orderQuantity + 1;
  }

  // quantity decrement
  decrement() {
    return this.orderQuantity =
      this.orderQuantity > 1
        ? this.orderQuantity - 1
        : this.orderQuantity = 1;
  }

  // quantityDecrement
  quantityDecrement(payload: IProduct) {
    state.cart_products.map((item: IProduct) => {
      if (item.id === payload.id) {
        if (typeof item.orderQuantity !== "undefined") {
          if (item.orderQuantity > 1) {
            item.orderQuantity = item.orderQuantity - 1;
            this.toastrService.info(`Decrement Quantity For ${item.title}`);
          }
        }
      }
      return { ...item };
    });
    localStorage.setItem("cart_products", JSON.stringify(state.cart_products));
  };

  // remover_cart_products
  removeCartProduct(payload: IProduct) {
    state.cart_products = state.cart_products.filter(
      (p: IProduct) => p.id !== payload.id
    );
    // Toast message removed as per user request
    localStorage.setItem("cart_products", JSON.stringify(state.cart_products));
  };

  // clear cart
  clear_cart(shouldConfirm: boolean = true) {
    let canClear = true;
    if (shouldConfirm) {
      canClear = window.confirm(
        "Are you sure deleted your all cart items ?"
      );
    }

    if (canClear) {
      state.cart_products = [];
    }
    localStorage.setItem("cart_products", JSON.stringify(state.cart_products));
  };
  // initialOrderQuantity
  initialOrderQuantity() {
    return this.orderQuantity = 1;
  };
}
