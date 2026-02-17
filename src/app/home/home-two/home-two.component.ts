import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/shared/services/product.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { IProduct } from 'src/app/shared/types/product-d-t';
import { WebSectionItemDto } from 'src/app/shared/types/product-list-model';

interface BannerData {
  id: number;
  title: string;
  imageUrl: string;
  redirectUrl: string;
}

@Component({
  selector: 'app-home-two',
  templateUrl: './home-two.component.html',
  styleUrls: ['./home-two.component.scss']
})
export class HomeTwoComponent implements OnInit {
  public trending_products: IProduct[] = [];
  public discount_products: IProduct[] = [];
  public bannerData: BannerData | undefined;
  private trendingLoaded: boolean = false;
  private discountLoaded: boolean = false;

  constructor(
    private productService: ProductService,
    private loaderService: LoaderService
  ) {
    // No fallback to static data - only use API data
  }

  ngOnInit(): void {
    // Show loader when starting to load data
    this.loaderService.show();
    this.loadBannerData();
    this.loadTrendingProducts();
  }

  /**
   * Load trending products from API (using top featured products API)
   */
  private loadTrendingProducts(): void {
    // Reset flags
    this.trendingLoaded = false;
    this.discountLoaded = false;

    // Load top featured products for trending section
    this.productService.getTopFeaturedProducts().subscribe({
      next: (products) => {
        if (products && products.length > 0) {
          // Mark all as trending since they're from featured API
          products.forEach(p => p.trending = true);
          this.trending_products = products.slice(0, 6);
          console.log('Trending products (top featured) loaded from API:', this.trending_products.length);
        } else {
          this.trending_products = [];
        }
        this.trendingLoaded = true;
        this.checkAndHideLoader();
      },
      error: (error) => {
        console.error('Error loading trending products from API:', error);
        this.trending_products = [];
        this.trendingLoaded = true;
        this.checkAndHideLoader();
      }
    });

    // Load discount products separately from product list
    this.productService.getProductListFromAPI().subscribe({
      next: (products) => {
        if (products && products.length > 0) {
          this.discount_products = products.filter((p) => p.discount! > 0).slice(0, 12);
          console.log('Discount products loaded from API:', this.discount_products.length);
        } else {
          this.discount_products = [];
        }
        this.discountLoaded = true;
        this.checkAndHideLoader();
      },
      error: (error) => {
        console.error('Error loading discount products from API:', error);
        this.discount_products = [];
        this.discountLoaded = true;
        this.checkAndHideLoader();
      }
    });
  }

  /**
   * Load banner data from WebSection API
   */
  private loadBannerData(): void {
    this.productService.getSectionItemsByName('Offer').subscribe({
      next: (items) => {
        if (items && items.length > 0) {
          const bannerItem = items[0];
          this.bannerData = {
            id: bannerItem.id,
            title: bannerItem.title || bannerItem.subtitle || '',
            imageUrl: bannerItem.imageUrl || '',
            redirectUrl: (bannerItem.redirectUrl && bannerItem.redirectUrl.trim() !== '')
              ? bannerItem.redirectUrl
              : '#'
          };
          console.log('Banner data loaded from API:', this.bannerData);
        } else {
          console.log('No banner items found in API response for section "Banner"');
          this.bannerData = undefined;
        }
      },
      error: (error) => {
        console.error('Error loading banner data:', error);
        this.bannerData = undefined;
      }
    });
  }

  /**
   * Check if all data is loaded and hide loader
   */
  private checkAndHideLoader(): void {
    if (this.trendingLoaded && this.discountLoaded) {
      // Hide loader when all products are loaded
      this.loaderService.hide();
    }
  }

  /**
   * Check if URL is external (starts with http:// or https://)
   */
  isExternalUrl(url: string | undefined): boolean {
    if (!url || url.trim() === '' || url === '#') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  }

  /**
   * Check if banner has a valid redirect URL
   */
  hasValidRedirectUrl(): boolean {
    if (!this.bannerData) return false;
    const url = this.bannerData.redirectUrl;
    return !!(url && url.trim() !== '' && url !== '#');
  }

  /**
   * Get the link for banner - returns routerLink array for internal or href string for external
   */
  getBannerLink(): any[] | string {
    if (this.bannerData) {
      const redirectUrl = this.bannerData.redirectUrl;
      // If redirectUrl is empty or '#', return '#'
      if (!redirectUrl || redirectUrl === '#') {
        return '#';
      }
      // Check if external URL
      if (this.isExternalUrl(redirectUrl)) {
        return redirectUrl;
      }
      // Internal route
      return [redirectUrl];
    }
    return '#';
  }

  /**
   * Default banner image path
   */
  readonly DEFAULT_BANNER_IMAGE = 'assets/img/default-img/banner.png';

  /**
   * Get image URL or default if empty/null
   */
  getImageUrl(imageUrl: string | undefined): string {
    if (imageUrl && imageUrl.trim() !== '') {
      return imageUrl;
    }
    return this.DEFAULT_BANNER_IMAGE;
  }

  /**
   * Get banner image URL - returns default if bannerData is undefined or imageUrl is empty
   */
  getBannerImageUrl(): string {
    if (this.bannerData && this.bannerData.imageUrl && this.bannerData.imageUrl.trim() !== '') {
      return this.bannerData.imageUrl;
    }
    return this.DEFAULT_BANNER_IMAGE;
  }

  /**
   * Get banner title or empty string
   */
  getBannerTitle(): string {
    return this.bannerData?.title || '';
  }

  ngAfterViewInit() {

  }
}
