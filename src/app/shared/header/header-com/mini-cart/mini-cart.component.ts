import { Component } from '@angular/core';
import { CartService } from 'src/app/shared/services/cart.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-mini-cart',
  templateUrl: './mini-cart.component.html',
  styleUrls: ['./mini-cart.component.scss']
})
export class MiniCartComponent {
  constructor(public cartService: CartService) { }

  /**
   * Check if item has selected attributes
   */
  hasAttributes(item: IProduct): boolean {
    return !!(item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0);
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
}
