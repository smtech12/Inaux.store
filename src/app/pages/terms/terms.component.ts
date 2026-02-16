import { Component, OnInit } from '@angular/core';
import { TenantService } from '../../shared/services/tenant.service';
import { TenantHeaderInfoDTO } from '../../shared/types/tenant-header-model';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent implements OnInit {
  
  // API data
  public tenantHeaderInfo: TenantHeaderInfoDTO | null = null;
  public contactEmail: string = 'info@halabrand.com';
  public contactPhone: string = '+92 300 1234567';
  public contactAddress: string = 'Karachi, Pakistan';

  constructor(private tenantService: TenantService) { }

  ngOnInit(): void {
    this.loadTenantHeaderInfo();
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
          this.contactAddress = data.tenantHeader.address || this.contactAddress;
        }
      },
      error: (error) => {
        console.error('Error loading tenant header info:', error);
        // Keep default values on error
      }
    });
  }
}
