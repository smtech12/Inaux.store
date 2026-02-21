import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { UtilsService } from '../../services/utils.service';
import { TenantService } from '../../services/tenant.service';
import { ProductService } from '../../services/product.service';
import { WebSectionItemDto } from '../../types/product-list-model';

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
  public announcementBarItems: WebSectionItemDto[] = [];

  constructor(
    public cartService: CartService,
    public utilsService: UtilsService,
    private tenantService: TenantService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.loadTenantHeaderInfo();
    this.loadAnnouncementBar();
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
   * Load announcement bar items from Web Section API
   */
  private loadAnnouncementBar() {
    this.productService.getSectionItemsByName('Announcement Bar').subscribe({
      next: (items) => {
        if (items && items.length > 0) {
          this.announcementBarItems = items;
        }
      },
      error: (error) => {
        console.error('Error loading announcement bar items:', error);
      }
    });
  }

  /**
   * Handle image load error - fallback to default logo
   */
  onLogoError(event: any): void {
    try {
      if (event && event.target) {
        event.target.src = '';
        this.logoPath = '';
      }
    } catch (error) {
      console.error('Error handling logo fallback:', error);
      this.logoPath = '';
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
