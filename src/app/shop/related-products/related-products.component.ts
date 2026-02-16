import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ProductService } from 'src/app/shared/services/product.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-related-products',
  templateUrl: './related-products.component.html',
  styleUrls: ['./related-products.component.scss'],
})
export class RelatedProductsComponent implements OnInit, OnChanges {
  @Input() productId: number | undefined;
  @Input() brand: string | undefined; // Keep for backward compatibility
  @Input() categoryId: number | undefined; // New input for category-based related products
  public related_products: IProduct[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadRelatedProducts();
  }

  ngOnChanges(changes: SimpleChanges) {
    // If categoryId or productId changes, reload related products
    if (changes['categoryId'] || changes['productId']) {
      this.loadRelatedProducts();
    }
  }

  private loadRelatedProducts() {
    // Use categoryId if provided (preferred method with API)
    if (this.categoryId && this.productId) {
      this.productService
        .getRelatedProductsByCategory(this.categoryId, this.productId)
        .subscribe((products) => {
          this.related_products = products; // API already returns max 4 products
        });
    }
    // Fallback to brand-based filtering (legacy method)
    else if (this.productId && this.brand) {
      this.productService
        .getRelatedProducts(this.productId, this.brand)
        .subscribe((products) => {
          this.related_products = products.slice(0, 4);
        });
    }
  }
}
