import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ProductService } from 'src/app/shared/services/product.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-feature-products',
  templateUrl: './feature-products.component.html',
  styleUrls: ['./feature-products.component.scss']
})
export class FeatureProductsComponent implements OnInit, OnChanges {

  @Input() categoryId: number | null = null;
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';
  public feature_products: IProduct[] = [];

  constructor(public productService: ProductService) { }

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId']) {
      this.loadFeaturedProducts();
    }
  }

  /**
   * Load featured products from API
   */
  private loadFeaturedProducts(): void {
    this.productService.getTopFeaturedProducts(this.categoryId).subscribe({
      next: (products) => {
        if (products && products.length > 0) {
          // Take more products for horizontal layout, 2 for sidebar
          const count = this.layout === 'horizontal' ? 6 : 2;
          this.feature_products = products.slice(0, count);
          console.log(`Featured products loaded from API (${this.layout}):`, this.feature_products.length);
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
