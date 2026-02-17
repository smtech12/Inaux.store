import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { UtilsService } from '../../services/utils.service';
import { TenantService } from '../../services/tenant.service';

@Component({
  selector: 'app-header-one',
  templateUrl: './header-one.component.html',
  styleUrls: ['./header-one.component.scss']
})
export class HeaderOneComponent implements OnInit {
  @Input() header_big = false;
  @Input() white_bg = false;
  @Input() transparent = false;

  public sticky: boolean = false;
  public logoPath: string = '/assets/img/logo/Haala.png';

  constructor(
    public cartService: CartService,
    public utilsService: UtilsService,
    private tenantService: TenantService
  ) { }

  ngOnInit(): void {
    this.loadTenantHeaderInfo();
  }

  /**
   * Load tenant header information from API
   */
  private loadTenantHeaderInfo() {
    this.tenantService.getTenantHeaderInfo().subscribe({
      next: (data) => {
        if (data && data.tenantHeader && data.tenantHeader.logo) {
          this.logoPath = data.tenantHeader.logo;
        }
      },
      error: (error) => {
        console.error('Error loading tenant header info in header:', error);
      }
    });
  }

  /**
   * Handle image load error - fallback to default logo
   */
  onLogoError(event: any): void {
    try {
      if (event && event.target) {
        event.target.src = '/assets/img/logo/logo.png';
        this.logoPath = '/assets/img/logo/logo.png';
      }
    } catch (error) {
      console.error('Error handling logo fallback:', error);
      this.logoPath = '/assets/img/logo/logo.png';
    }
  }

  // sticky nav
  @HostListener('window:scroll') onscroll() {
    if (window.scrollY > 80) {
      this.sticky = true;
    } else {
      this.sticky = false;
    }
  }
}
