import { Component, Input, OnInit } from '@angular/core';
import { ProductService } from '../../../../shared/services/product.service';
import { WebSectionDto, WebSectionItemDto } from '../../../../shared/types/product-list-model';
import { Observable } from 'rxjs';

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

  sectionItems$: Observable<WebSectionDto[]> = new Observable();
  backgroundImage: string = '';
  bannerTitle: string = this.title;
  bannerSubtitle: string = this.subtitle;
  redirectUrl: string = '';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // Use the same pattern as get-header-info - use ProductService.getAllSections()
    this.sectionItems$ = this.productService.getAllSections();
    
    this.sectionItems$.subscribe(sections => {
      if (sections && Array.isArray(sections)) {
        // Find the specific section by name (case-insensitive)
        const targetSection = sections.find((section: WebSectionDto) => 
          section.sectionName && section.sectionName.toLowerCase() === this.sectionName.toLowerCase() && section.isActive
        );
        
        if (targetSection && targetSection.items && Array.isArray(targetSection.items)) {
          // Return only active items, sorted by DisplayOrder
          const items = targetSection.items
            .filter((item: WebSectionItemDto) => item.isActive)
            .sort((a: WebSectionItemDto, b: WebSectionItemDto) => a.displayOrder - b.displayOrder);
          
          if (items.length > 0) {
            const firstItem = items[0];
            
            // ALWAYS use API data when items exist
            this.backgroundImage = firstItem.imageUrl || '';
            this.bannerTitle = firstItem.title || this.title;
            this.bannerSubtitle = firstItem.subtitle || this.subtitle;
            this.redirectUrl = firstItem.redirectUrl || '';
          } else {
            // Only use fallback if useFallbackOnly is true and no API data
            if (this.useFallbackOnly) {
              this.backgroundImage = this.fallbackBg;
            } else {
              this.backgroundImage = ''; // No fallback when useFallbackOnly is false
            }
          }
        } else {
          // Only use fallback if useFallbackOnly is true and no API data
          if (this.useFallbackOnly) {
            this.backgroundImage = this.fallbackBg;
          } else {
            this.backgroundImage = ''; // No fallback when useFallbackOnly is false
          }
        }
      } else {
        // Only use fallback if useFallbackOnly is true and no API data
        if (this.useFallbackOnly) {
          this.backgroundImage = this.fallbackBg;
        } else {
          this.backgroundImage = ''; // No fallback when useFallbackOnly is false
        }
      }
    });
  }

  onBannerClick(): void {
    if (this.redirectUrl && this.redirectUrl.trim() !== '') {
      window.open(this.redirectUrl, '_blank');
    }
  }
}
