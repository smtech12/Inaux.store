import { Component, OnInit } from '@angular/core';
import { TenantService } from '../../shared/services/tenant.service';
import { TenantHeaderInfoDTO } from '../../shared/types/tenant-header-model';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  public contactAddress: string = '1234 Heaven Stress, Beverly Hill, Melbourne, USA.';
  public contactEmail: string = 'Contact@erentheme.com';
  public contactPhone: string = '(800) 123 456 789, (800) 987 654 321';
  public storeName: string = '';
  public tenantHeaderInfo: TenantHeaderInfoDTO | null = null;

  constructor(private tenantService: TenantService) {}

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
            this.contactAddress = data.tenantHeader.address || this.contactAddress;
            this.contactEmail = data.tenantHeader.contactEmail || this.contactEmail;
            this.contactPhone = data.tenantHeader.contactPhone || this.contactPhone;
            this.storeName = data.tenantHeader.storeName || this.storeName;
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
