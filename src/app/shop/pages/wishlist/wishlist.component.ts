import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from 'src/app/shared/services/cart.service';
import { WishlistService } from 'src/app/shared/services/wishlist.service';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
})
export class WishlistComponent {
  constructor(
    public wishlistService: WishlistService,
    public cartService: CartService,
    public utilsService: UtilsService,
    private router: Router
  ) { }

  /**
   * Add product to cart - opens modal if variable, otherwise adds directly
   */
  addToCart(item: IProduct) {
    // If product is variable, open modal for variant selection
    if (item.isVariable) {
      const modalId = `product-modal-${item.id}`;
      this.utilsService.handleOpenModal(modalId, item);
      this.utilsService.modalMode = 'cart';
    } else {
      // Directly add to cart for non-variable products
      this.cartService.addCartProduct(item);
    }
  }

  /**
   * Direct checkout for wishlist item
   */
  directCheckout(item: IProduct) {
    // Add item to cart (with its saved attributes from wishlist)
    this.cartService.addCartProduct(item, item.variantId);
    // Navigate to checkout page
    this.router.navigate(['/checkout']);
  }
}
