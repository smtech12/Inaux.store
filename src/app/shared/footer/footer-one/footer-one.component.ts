import { Component, Input, OnInit } from '@angular/core';
import social_links, { ISocial } from '../../data/social-data';
import { TenantService } from '../../services/tenant.service';
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

  constructor(private tenantService: TenantService) { }

  ngOnInit() {
    this.loadTenantHeaderInfo();
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
              ? `Phone Number: ${data.tenantHeader.contactPhone}`
              : this.contactPhone;
            this.storeName = data.tenantHeader.storeName || this.storeName;

            // Use default Haala logo - don't use API logo, always use default
            this.logoUrl = '/assets/img/logo/Haala.png';

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
}
