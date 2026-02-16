import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/shared/services/product.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-feature-products',
  templateUrl: './feature-products.component.html',
  styleUrls: ['./feature-products.component.scss']
})
export class FeatureProductsComponent implements OnInit {

  public feature_products: IProduct[] = [];

  constructor(public productService: ProductService) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  /**
   * Load featured products from API
   */
  private loadFeaturedProducts(): void {
    this.productService.getTopFeaturedProducts().subscribe({
      next: (products) => {
        if (products && products.length > 0) {
          // Take first 2 featured products for sidebar
          this.feature_products = products.slice(0, 2);
          console.log('Featured products loaded from API:', this.feature_products.length);
        } else {
          this.feature_products = [];
        }
      },
      error: (error) => {
        console.error('Error loading featured products from API:', error);
        this.feature_products = [];
      }
    });
  }

}
