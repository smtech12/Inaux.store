import { Component, Input, OnInit } from '@angular/core';
import { ProductService } from '../../../../shared/services/product.service';
import { WebSectionItemDto } from '../../../../shared/types/product-list-model';
// import { Observable } from 'rxjs'; // Removed unused

@Component({
  selector: 'app-dynamic-page-title',
  templateUrl: './dynamic-page-title.component.html',
  styleUrls: ['./dynamic-page-title.component.scss']
})
export class DynamicPageTitleComponent implements OnInit {
  @Input() title: string = 'Shop';
  @Input() subtitle: string = 'Shop';
  @Input() sectionName: string = 'Product Banner';
  @Input() fallbackBg: string = '/assets/img/page-title/page-title-3.png';
  @Input() useFallbackOnly: boolean = true;

  // sectionItems$: Observable<WebSectionDto[]> = new Observable();
  backgroundImage: string = '';
  bannerTitle: string = this.title;
  bannerSubtitle: string = this.subtitle;
  redirectUrl: string = '';

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    // Determine the section name to use. Prioritize Input, default to 'Product Banner'
    const sectionToFetch = this.sectionName || 'Product Banner';
    console.log('DynamicPageTitle: Fetching section:', sectionToFetch);

    // Use the service helper method directly
    this.productService.getSectionItemsByName(sectionToFetch).subscribe({
      next: (items: WebSectionItemDto[]) => {
        if (items && items.length > 0) {
          const firstItem = items[0];

          // ALWAYS use API data when items exist
          if (firstItem.imageUrl) {
            this.backgroundImage = firstItem.imageUrl;
            console.log('DynamicPageTitle: Banner loaded:', this.backgroundImage);
          }

          // Only update title/subtitle if they are set in the banner item and not just empty strings
          // But usually page title components prioritize the Input title/subtitle for the text content
          // The banner item might have its own title/subtitle, but for "Product Banner" it seems strictly visual in many cases.
          // However, existing logic effectively overwrote them if present.
          // Let's keep existing behavior: overwrite if present in API item.
          if (firstItem.title) {
            this.bannerTitle = firstItem.title;
          }
          if (firstItem.subtitle) {
            this.bannerSubtitle = firstItem.subtitle;
          }

          this.redirectUrl = firstItem.redirectUrl || '';
        } else {
          console.warn('DynamicPageTitle: No items found for section:', sectionToFetch);
          // If no items found, try forcing a refresh of the cache (once)
          this.retryWithRefresh(sectionToFetch);
        }
      },
      error: (err) => {
        console.error('DynamicPageTitle: Error loading section:', err);
        // On error, also try refresh
        this.retryWithRefresh(sectionToFetch);
      }
    });
  }

  private retryWithRefresh(sectionName: string): void {
    console.log('DynamicPageTitle: Retrying with cache refresh for:', sectionName);
    this.productService.getSectionItemsByName(sectionName, true).subscribe({
      next: (items) => {
        if (items && items.length > 0) {
          const firstItem = items[0];
          if (firstItem.imageUrl) {
            this.backgroundImage = firstItem.imageUrl;
            console.log('DynamicPageTitle: Banner loaded after refresh:', this.backgroundImage);
          }
          if (firstItem.title) { this.bannerTitle = firstItem.title; }
          if (firstItem.subtitle) { this.bannerSubtitle = firstItem.subtitle; }
          this.redirectUrl = firstItem.redirectUrl || '';
        } else {
          this.handleFallback();
        }
      },
      error: () => this.handleFallback()
    });
  }

  private handleFallback(): void {
    if (this.useFallbackOnly) {
      this.backgroundImage = this.fallbackBg;
    } else {
      this.backgroundImage = '';
    }
  }

  onBannerClick(): void {
    if (this.redirectUrl && this.redirectUrl.trim() !== '') {
      window.open(this.redirectUrl, '_blank');
    }
  }
}
