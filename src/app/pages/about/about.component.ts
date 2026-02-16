import { Component, OnInit } from '@angular/core';
import { TenantService } from '../../shared/services/tenant.service';
import { TenantHeaderInfoDTO } from '../../shared/types/tenant-header-model';
import { ProductService } from '../../shared/services/product.service';
import { WebSectionItemDto } from '../../shared/types/product-list-model';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  public socialMediaItems: WebSectionItemDto[] = [];
  
  // API data
  public tenantHeaderInfo: TenantHeaderInfoDTO | null = null;
  public contactEmail: string = 'info@halabrand.com';
  public contactPhone: string = '+92 300 1234567';

  constructor(
    private tenantService: TenantService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.loadTenantHeaderInfo();
    this.loadSocialMediaLinks();
  }

  /**
   * Load tenant header information from API
   */
  private loadTenantHeaderInfo() {
    this.tenantService.getTenantHeaderInfo().subscribe({
      next: (data) => {
        if (data && data.tenantHeader) {
          this.tenantHeaderInfo = data;
          this.contactEmail = data.tenantHeader.contactEmail || this.contactEmail;
          this.contactPhone = data.tenantHeader.contactPhone || this.contactPhone;
        }
      },
      error: (error) => {
        console.error('Error loading tenant header info:', error);
        // Keep default values on error
      }
    });
  }

  /**
   * Load social media links from API (same as footer)
   */
  private loadSocialMediaLinks() {
    this.productService.getAllSections().subscribe(sections => {
      if (sections && Array.isArray(sections)) {
        // Find the Social Media section
        const socialMediaSection = sections.find((section: any) => 
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
   * Get font awesome icon class based on social media title (same as social-media-icons component)
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
