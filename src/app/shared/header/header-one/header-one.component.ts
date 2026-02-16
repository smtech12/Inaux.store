import { Component, HostListener, Input } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-header-one',
  templateUrl: './header-one.component.html',
  styleUrls: ['./header-one.component.scss']
})
export class HeaderOneComponent {
  @Input() header_big = false;
  @Input() white_bg = false;
  @Input() transparent = false;

  public sticky: boolean = false;
  public logoPath: string = '/assets/img/logo/Haala.png';

  constructor(
    public cartService: CartService,
    public utilsService: UtilsService,
  ) { }

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
