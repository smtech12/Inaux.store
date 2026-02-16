import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/shared/services/product.service';
import { IProduct } from 'src/app/shared/types/product-d-t';


@Component({
  selector: 'app-shop-details',
  templateUrl: './shop-details.component.html',
  styleUrls: ['./shop-details.component.scss']
})
export class ShopDetailsComponent implements OnInit {

  public product: IProduct | undefined;

  constructor(private productService: ProductService) {
    this.productService.products.subscribe((products) => {
      this.product = products[0];
    });
  }

  ngOnInit() {
    // Force refresh the sections cache to ensure API is called
    this.forceRefreshSections();
  }

  /**
   * Force refresh sections to ensure API is called
   */
  private forceRefreshSections(): void {
    // Clear any existing cache and force API call
    this.productService.clearWebSectionsCache();
    console.log('Sections cache cleared - fresh API call will be made');
    // This will trigger a fresh API call to get-section when the banner component initializes
  }

}
