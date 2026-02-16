import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { WebSectionDto, WebSectionItemDto } from '../../types/product-list-model';

@Component({
  selector: 'app-social-media-icons',
  templateUrl: './social-media-icons.component.html',
  styleUrls: ['./social-media-icons.component.scss']
})
export class SocialMediaIconsComponent implements OnInit {
  socialMediaItems: WebSectionItemDto[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // Get Social Media section from API
    this.productService.getAllSections().subscribe(sections => {
      if (sections && Array.isArray(sections)) {
        // Find the Social Media section
        const socialMediaSection = sections.find((section: WebSectionDto) => 
          section.sectionName && section.sectionName.toLowerCase() === 'social media' && section.isActive
        );
        
        if (socialMediaSection && socialMediaSection.items && Array.isArray(socialMediaSection.items)) {
          // Filter only items with redirectUrl and sort by displayOrder
          this.socialMediaItems = socialMediaSection.items
            .filter((item: WebSectionItemDto) => item.isActive && item.redirectUrl && item.redirectUrl.trim() !== '')
            .sort((a: WebSectionItemDto, b: WebSectionItemDto) => a.displayOrder - b.displayOrder);
        }
      }
    });
  }

  /**
   * Get font awesome icon class based on social media title
   */
  getIconClass(title: string): string {
    const titleLower = title.toLowerCase();
    
    switch(titleLower) {
      case 'facebook':
        return 'fa-facebook-f fab';
      case 'twitter':
        return 'fa-twitter fab';
      case 'instagram':
        return 'fa-instagram fab';
      case 'tik tok':
      case 'tiktok':
        return 'fa-tiktok fab';
      case 'youtube':
        return 'fa-youtube fab';
      case 'linkedin':
        return 'fa-linkedin-in fab';
      case 'pinterest':
        return 'fa-pinterest-p fab';
      case 'whatsapp':
        return 'fa-whatsapp fab';
      case 'telegram':
        return 'fa-telegram fab';
      default:
        return 'fa-link fab';
    }
  }
}
