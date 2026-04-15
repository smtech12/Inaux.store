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
   * Add product to cart — always open modal to ensure variant ID is resolved
   */
  addToCart(item: IProduct) {
    const modalId = `product-modal-${item.id}`;
    this.utilsService.handleOpenModal(modalId, item);
    this.utilsService.modalMode = 'cart';
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
