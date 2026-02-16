import { Component, Input } from '@angular/core';
import { CartService } from 'src/app/shared/services/cart.service';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-product-sm-item',
  templateUrl: './product-sm-item.component.html',
  styleUrls: ['./product-sm-item.component.scss']
})
export class ProductSmItemComponent {
  @Input() product!: IProduct;

  constructor(
    public cartService: CartService,
    public utilsService: UtilsService
  ) { }

  // add to cart
  addToCart(item: IProduct) {
    // If product is variable, open modal for variant selection
    if (item.isVariable) {
      const modalId = `product-modal-${item.id}`;
      this.utilsService.handleOpenModal(modalId, item);
    } else {
      // Directly add to cart for non-variable products
      this.cartService.addCartProduct(item);
    }
  }

  // Function to check if an item is in the cart
  isItemInCart(item: IProduct): boolean {
    return this.cartService.getCartProducts().some((prd: IProduct) => prd.id === item.id);
  }
}
