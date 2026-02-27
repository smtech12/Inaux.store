import { Component, HostListener, OnInit } from '@angular/core';
import { TenantService } from '../../services/tenant.service';

@Component({
  selector: 'app-back-to-top',
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.scss']
})
export class BackToTopComponent implements OnInit {

  scrollDisplay: string = 'none';
  private contactPhone: string | null = null;

  constructor(private tenantService: TenantService) { }

  ngOnInit() {
    this.loadContactPhone();
  }

  @HostListener('window:scroll', [])
  onScroll() {
    if (window.scrollY > 200) {
      this.scrollDisplay = 'block';
    } else {
      this.scrollDisplay = 'none';
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Load contact phone number from tenant service
   */
  private loadContactPhone(): void {
    this.tenantService.getTenantHeaderInfo().subscribe({
      next: (tenantInfo) => {
        if (tenantInfo && tenantInfo.tenantHeader) {
          this.contactPhone = tenantInfo.tenantHeader.contactPhone;
        }
      },
      error: () => {
        this.contactPhone = '03212482592';
      }
    });
  }

  /**
   * Open WhatsApp with a general message
   */
  openWhatsApp(): void {
    let phoneNumber = this.contactPhone || '03212482592';

    // Format Pakistani phone number for WhatsApp
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('92')) {
      cleanPhone = '92' + cleanPhone;
    }

    const message = `I need some information related to products.\n\nWaiting for your quick response.`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
}
