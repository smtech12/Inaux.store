import { Component,Input } from '@angular/core';
import { CartService } from 'src/app/shared/services/cart.service';
import { CompareService } from 'src/app/shared/services/compare.service';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { WishlistService } from 'src/app/shared/services/wishlist.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss']
})
export class ProductItemComponent {
  @Input() product!: IProduct;
  @Input() openModalAlways: boolean = false;

  constructor(
    public cartService: CartService,
    public wishlistService: WishlistService,
    public compareService: CompareService,
    public utilsService: UtilsService,
  ) {}

  /**
   * Default product image path
   */
  readonly DEFAULT_PRODUCT_IMAGE = 'assets/img/default-img/product detail.jpg';

  /**
   * Get image URL or default if empty/null or from assets folder (static data)
   */
  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return this.DEFAULT_PRODUCT_IMAGE;
    }
    
    // Check if image is from assets folder (static data) - exclude default-img folder
    const normalizedUrl = imageUrl.toLowerCase().trim();
    if (normalizedUrl.includes('assets/img/shop/product/') || 
        normalizedUrl.includes('assets/img/shop/banner/') ||
        (normalizedUrl.startsWith('/assets/') && !normalizedUrl.includes('default-img'))) {
      return this.DEFAULT_PRODUCT_IMAGE;
    }
    
    return imageUrl;
  }

  // add to cart
  addToCart(item: IProduct) {
    // If product is variable, open modal for variant selection
    if (item.isVariable || this.openModalAlways) {
      const modalId = `product-modal-${item.id}`;
      this.utilsService.handleOpenModal(modalId, item);
    } else {
      // Directly add to cart for non-variable products
      this.cartService.addCartProduct(item);
    }
  }

   // add to cart
   addToWishlist(product: IProduct) {
    this.wishlistService.add_wishlist_product(product);
  }

  // add to cart
  addToCompare(product: IProduct) {
    this.compareService.add_compare_product(product);
  }

  // Function to check if an item is in the cart
  isItemInCart(item: IProduct): boolean {
    return this.cartService.getCartProducts().some((prd: IProduct) => prd.id === item.id);
  }
  isItemInWishlist(item: IProduct): boolean {
    return this.wishlistService.getWishlistProducts().some((prd: IProduct) => prd.id === item.id);
  }
  isItemInCompare(item: IProduct): boolean {
    return this.compareService.getCompareProducts().some((prd: IProduct) => prd.id === item.id);
  }

}
