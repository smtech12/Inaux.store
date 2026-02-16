import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ProductService } from 'src/app/shared/services/product.service';

@Component({
  selector: 'app-size-filtering',
  templateUrl: './size-filtering.component.html',
  styleUrls: ['./size-filtering.component.scss'],
})
export class SizeFilteringComponent {
  public all_sizes: string[] = ['21', '21.5', '22', '22.5', '23', '23.5'];
  public size: string | null = null;

  constructor(
    public productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private viewScroller: ViewportScroller
  ) {
    this.route.queryParams.subscribe((params) => {
      this.size = params['size'] ? params['size'] : null;
    });
  }

  handleSize(size: string) {
    // Define the query parameters as an object
    const queryParams: Params = {
      size: size.toLowerCase(),
    };

    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams, // Pass the queryParams object here
        queryParamsHandling: 'merge',
        skipLocationChange: false,
      })
      .finally(() => {
        this.viewScroller.setOffset([120, 120]);
        this.viewScroller.scrollToAnchor('products'); // Anchore Link
      });
  }
}
