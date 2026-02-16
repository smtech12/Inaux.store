import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/shared/services/product.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-dynamic-shop-details',
  templateUrl: './dynamic-shop-details.component.html',
  styleUrls: ['./dynamic-shop-details.component.scss'],
})
export class DynamicShopDetailsComponent {
  public product: IProduct | null | undefined;
  public categoryId: number | undefined;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router,
    private loaderService: LoaderService
  ) {}

  ngOnInit() {
    // Show loader when starting to load product
    this.loaderService.show();
    
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (id) {
            return this.productService.getProductDetailById(Number(id));
          }
          return of<IProduct | null>(null);
        })
      )
      .subscribe({
        next: (product: IProduct | null | undefined) => {
          // Hide loader when product is loaded
          this.loaderService.hide();
          
          if (!product) {
            // Product not found, navigate to 404 page
            this.router.navigate(['/404']);
          } else {
            this.product = product;
            // Get categoryId from the cached product detail (from API response)
            this.categoryId = this.productService.getCurrentProductCategoryId() || undefined;
          }
        },
        error: (error) => {
          // Hide loader on error
          this.loaderService.hide();
          console.error('Error loading product:', error);
          this.router.navigate(['/404']);
        }
      });
  }
}
