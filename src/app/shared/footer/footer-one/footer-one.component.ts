import { Component, Input, OnInit } from '@angular/core';
import social_links, { ISocial } from '../../data/social-data';
import { TenantService } from '../../services/tenant.service';
import { ProductService } from '../../services/product.service';
import { TenantHeaderInfoDTO } from '../../types/tenant-header-model';

@Component({
  selector: 'app-footer-one',
  templateUrl: './footer-one.component.html',
  styleUrls: ['./footer-one.component.scss']
})
export class FooterOneComponent implements OnInit {
  @Input() box_style: Boolean = false;
  public social_links: ISocial[] = social_links;

  // API data
  public tenantHeaderInfo: TenantHeaderInfoDTO | null = null;
  public contactAddress: string = 'Add: 1234 Heaven Stress, Beverly Hill, Melbourne, USA.';
  public contactEmail: string = 'Email: Contact@basictheme.com';
  public contactPhone: string = 'Phone Number: (800) 123 456 789';
  public storeName: string = '';
  public logoUrl: string = '/assets/img/logo/Haala.png';
  public visitorCount: number = 0;
  public companyDescription: string = 'Haala is a premium e-commerce brand offering refined headwear and exquisite fragrances. Crafted for those who appreciate timeless elegance and quality.';

  constructor(
    private tenantService: TenantService,
    private productService: ProductService
  ) { }

  ngOnInit() {
    this.loadTenantHeaderInfo();
    this.loadCompanyDescription();
  }

  /**
   * Load tenant header information from API
   */
  private loadTenantHeaderInfo() {
    this.tenantService.getTenantHeaderInfo().subscribe({
      next: (data) => {
        if (data) {
          this.tenantHeaderInfo = data;

          // Update contact information from API
          if (data.tenantHeader) {
            // Format address with "Add: " prefix
            this.contactAddress = data.tenantHeader.address
              ? `Add: ${data.tenantHeader.address}`
              : this.contactAddress;
            this.contactEmail = data.tenantHeader.contactEmail
              ? `Email: ${data.tenantHeader.contactEmail}`
              : this.contactEmail;
            this.contactPhone = data.tenantHeader.contactPhone
              ? `${data.tenantHeader.contactPhone}`
              : this.contactPhone;
            this.storeName = data.tenantHeader.storeName || this.storeName;

            // Use logo from API
            this.logoUrl = data.tenantHeader.logo || '/assets/img/logo/Haala.png';

            // Set visitor count
            this.visitorCount = data.tenantHeader.vistourCount || 0;
          }
        }
      },
      error: (error) => {
        console.error('Error loading tenant header info:', error);
        // Keep default values on error
      }
    });
  }

  /**
   * Load company description from web sections API
   */
  private loadCompanyDescription() {
    this.productService.getSectionItemsByName('Company Description').subscribe({
      next: (items) => {
        if (items && items.length > 0) {
          const item = items[0];
          // Combine title and subtitle to show description
          // For example: "INAUX is a contemporary jewelry brand..."
          this.companyDescription = `${item.title} ${item.subtitle}`.trim();
        }
      },
      error: (error) => {
        console.error('Error loading company description:', error);
      }
    });
  }
}
