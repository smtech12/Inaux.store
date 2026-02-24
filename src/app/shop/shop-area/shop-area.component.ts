import { Component, Input, HostListener } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/shared/services/product.service';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-shop-area',
  templateUrl: './shop-area.component.html',
  styleUrls: ['./shop-area.component.scss']
})
export class ShopAreaComponent {
  @Input() shop_right = false;
  @Input() shop_4_col = false;
  @Input() shop_3_col = false;

  public categoryId: number | null = null; // Add property to hold category ID for child components

  public products: IProduct[] = [];
  public minPrice: number = 0;
  public maxPrice: number = this.productService.maxPrice;
  public niceSelectOptions = this.productService.filterSelect;
  public brands: string[] = [];
  public size: string | null = null;
  public color: string | null = null;
  public brand: string | null = null;
  public pageNo: number = 1;
  public pageSize: number = 12;
  public paginate: any = {}; // Pagination use only
  public sortBy: string = 'asc'; // Sorting Order

  // Filter bar properties
  public activeDropdown: string | null = null;
  public selectedAvailability: string[] = [];
  public inStockCount: number = 0;
  public outOfStockCount: number = 0;
  public allProducts: IProduct[] = []; // unfiltered for counts
  public priceFrom: number | null = null;
  public priceTo: number | null = null;
  public filterOffcanvasOpen: boolean = false;
  public mobileActiveSection: string | null = null;

  constructor(
    public productService: ProductService,
    public utilsService: UtilsService,
    private route: ActivatedRoute,
    private router: Router,
    private viewScroller: ViewportScroller,
    private loaderService: LoaderService
  ) {
    this.route.queryParams.subscribe((params) => {
      // console.log('params', params);
      this.minPrice = params['minPrice'] ? Number(params['minPrice']) : 0;
      // Don't set maxPrice from params - it will be set from product list
      const filterMaxPrice = params['maxPrice'] ? Number(params['maxPrice']) : null;
      this.brand = params['brand'] ? params['brand'] : null;
      this.size = params['size'] ? params['size'] : null;
      this.color = params['color'] ? params['color'] : null;
      this.pageNo = params['page'] ? params['page'] : this.pageNo;
      this.sortBy = params['sortBy'] ? params['sortBy'] : 'asc';
      // Restore availability filter from query params
      if (params['availability']) {
        this.selectedAvailability = params['availability'].split(',');
      }
      // Restore price inputs from query params
      this.priceFrom = params['minPrice'] ? Number(params['minPrice']) : null;
      this.priceTo = params['maxPrice'] ? Number(params['maxPrice']) : null;

      // Get Products from API
      const categoryId = params['categoryId'] ? Number(params['categoryId']) : null;
      this.categoryId = categoryId; // Update local property

      // Show loader when starting to load products
      this.loaderService.show();

      // Use getProductsByCategory if categoryId is provided, otherwise use getProductListFromAPI
      const productObservable = categoryId ?
        this.productService.getProductsByCategory(categoryId) :
        this.productService.getProductListFromAPI();

      productObservable.subscribe({
        next: (response) => {
          console.log('Products received in component:', response);

          // Set maxPrice from product list (for slider ceiling) - always use actual max from products
          if (response && response.length > 0) {
            const apiMaxPrice = Math.max(...response.map(p => p.price));
            this.maxPrice = apiMaxPrice;
          } else {
            // No products, keep default or reset
            this.maxPrice = this.productService.maxPrice;
          }

          // Sorting Filter
          this.products = this.productService.sortProducts(response, this.sortBy);
          console.log('After sorting:', this.products);

          // brand Filter
          if (this.brand) {
            this.products = this.products.filter((p) => p.brand.toLowerCase() === this.brand);
          }

          // Price Filter - use filterMaxPrice from query params if provided, otherwise use maxPrice from products
          const maxPriceForFilter = filterMaxPrice !== null ? filterMaxPrice : this.maxPrice;
          console.log('Before price filter - minPrice:', this.minPrice, 'maxPriceForFilter:', maxPriceForFilter);
          this.products = this.products.filter(
            (p) => p.price >= Number(this.minPrice) && p.price <= Number(maxPriceForFilter)
          );
          console.log('After price filter:', this.products);
          // Calculate availability counts from the full product set (before pagination)
          this.allProducts = [...this.products];
          this.inStockCount = this.products.filter(p => p.stockStatus === 'In Stock').length;
          this.outOfStockCount = this.products.filter(p => p.stockStatus === 'Out of Stock').length;

          // Availability Filter
          if (this.selectedAvailability.length > 0) {
            this.products = this.products.filter(p => {
              if (this.selectedAvailability.includes('in_stock') && p.stockStatus === 'In Stock') return true;
              if (this.selectedAvailability.includes('out_of_stock') && p.stockStatus === 'Out of Stock') return true;
              return false;
            });
          }

          // Paginate Products
          this.paginate = this.productService.getPager(this.products.length, Number(+this.pageNo), this.pageSize);
          this.products = this.products.slice(this.paginate.startIndex, this.paginate.endIndex + 1);

          // Hide loader when products are loaded
          this.loaderService.hide();
        },
        error: (error) => {
          // Hide loader on error
          this.loaderService.hide();
          console.error('Error loading products:', error);
        }
      });
    });
  }

  ngOnInit() { }
  // Append filter value to Url
  updateFilter(tags: any) {
    console.log('tags', tags);
  }

  onSortingChange(value: string) {
    this.sortByFilter(value);
  }
  // SortBy Filter
  sortByFilter(value: string) {
    // Show loader when sorting
    this.loaderService.show();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy: value ? value : null },
      queryParamsHandling: 'merge', // preserve the existing query params in the route
      skipLocationChange: false  // do trigger navigation
    }).finally(() => {
      this.viewScroller.setOffset([120, 120]);
      this.viewScroller.scrollToAnchor('products'); // Anchore Link
      // Note: Loader will be hidden when products are loaded via queryParams subscription
    });
  }

  // product Pagination
  setPage(page: number) {
    // Show loader when changing page
    this.loaderService.show();

    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { page: page },
        queryParamsHandling: 'merge', // preserve the existing query params in the route
        skipLocationChange: false, // do trigger navigation
      })
      .finally(() => {
        this.viewScroller.setOffset([120, 120]);
        this.viewScroller.scrollToAnchor('products'); // Anchore Link
        // Note: Loader will be hidden when products are loaded via queryParams subscription
      });
  }

  handleResetFilter() {
    this.minPrice = 0;
    this.maxPrice = this.productService.maxPrice;
    this.selectedAvailability = [];
    this.priceFrom = null;
    this.priceTo = null;
    this.router.navigate(['/shop']);
  }

  // Filter bar methods
  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdown = null;
  }

  toggleDropdown(name: string) {
    this.activeDropdown = this.activeDropdown === name ? null : name;
  }

  toggleAvailability(value: string) {
    const idx = this.selectedAvailability.indexOf(value);
    if (idx > -1) {
      this.selectedAvailability.splice(idx, 1);
    } else {
      this.selectedAvailability.push(value);
    }
    // Re-trigger filtering via query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { availability: this.selectedAvailability.join(',') || null },
      queryParamsHandling: 'merge',
    });
  }

  resetAvailability() {
    this.selectedAvailability = [];
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { availability: null },
      queryParamsHandling: 'merge',
    });
  }

  applyPriceFilter() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        minPrice: this.priceFrom || null,
        maxPrice: this.priceTo || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  resetPriceFilter() {
    this.priceFrom = null;
    this.priceTo = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { minPrice: null, maxPrice: null },
      queryParamsHandling: 'merge',
    });
  }
}
