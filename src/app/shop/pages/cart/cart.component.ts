import { Component } from '@angular/core';
import { CartService } from 'src/app/shared/services/cart.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {

  couponCode: string = '';
  shipCost: number = 0;

  constructor (public cartService:CartService) {}

  handleCouponSubmit() {
    if(this.couponCode){
      this.couponCode = ''
    }
  }

  handleShippingCost(value: number | string) {
    if (value === 'free') {
      this.shipCost = 0;
    } else {
      this.shipCost = value as number;
    }
  }

  /**
   * Check if item has selected attributes
   */
  hasAttributes(item: IProduct): boolean {
    return !!(item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0);
  }

  /**
   * Get attribute entries with names and values for display
   * Returns array of { name: string, value: string } objects
   */
  getAttributeEntries(item: IProduct): Array<{ name: string; value: string }> {
    if (!item.selectedAttributes || Object.keys(item.selectedAttributes).length === 0) {
      return [];
    }

    const entries: Array<{ name: string; value: string }> = [];
    
    Object.entries(item.selectedAttributes).forEach(([key, value]) => {
      // Get attribute name from attributeNames map, or use a fallback
      const attributeName = item.attributeNames?.[key] || this.getFallbackAttributeName(key);
      entries.push({
        name: attributeName,
        value: value
      });
    });

    return entries;
  }

  /**
   * Fallback method to get attribute name if not stored
   * This handles cases where attribute names might not be available
   */
  private getFallbackAttributeName(attributeId: string | number): string {
    // Common attribute names - you can extend this based on your API
    const commonNames: { [key: string]: string } = {
      '2': 'Color',
      '3': 'Size',
      'color': 'Color',
      'size': 'Size',
      'Color': 'Color',
      'Size': 'Size'
    };
    
    return commonNames[attributeId.toString()] || `Attribute ${attributeId}`;
  }

  /**
   * Get the price to display for an item (priceAfterDiscount if available, otherwise calculated from price and discount)
   */
  getItemPrice(item: IProduct): number {
    if (item.priceAfterDiscount !== undefined && item.priceAfterDiscount > 0) {
      return item.priceAfterDiscount;
    } else if (item.discount && item.discount > 0) {
      return item.price - (item.price * item.discount) / 100;
    } else {
      return item.price;
    }
  }

  /**
   * Get the discount amount for an item
   */
  getItemDiscount(item: IProduct): number {
    if (!item.orderQuantity) return 0;
    
    const basePrice = item.price;
    const discount = item.discount || 0;
    
    if (discount > 0) {
      // Calculate discount: (price * discount / 100) * quantity
      const discountPerUnit = (basePrice * discount) / 100;
      return discountPerUnit * item.orderQuantity;
    }
    
    return 0;
  }
}
