import { Component, Input, OnInit } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { WebSectionItemDto } from '../../../types/product-list-model';

@Component({
  selector: 'app-breadcrumb-one',
  templateUrl: './breadcrumb-one.component.html',
  styleUrls: ['./breadcrumb-one.component.scss']
})
export class BreadcrumbOneComponent {
  @Input() bg?: string;
  @Input() title!: string;
  @Input() subtitle!: string;

  public bg_img = '/assets/img/page-title/page-title-3.png';

  constructor(private productService: ProductService) { }

  ngOnInit() {
    if (this.bg) {
      this.bg_img = this.bg;
    } else {
      this.loadProductBanner();
    }
  }

  private loadProductBanner(): void {
    this.productService.getSectionItemsByName('Product Banner').subscribe({
      next: (items: any[]) => {
        if (items && items.length > 0) {
          const bannerItem = items[0];
          if (bannerItem.imageUrl) {
            this.bg_img = bannerItem.imageUrl;
          }
        }
      },
      error: (err: any) => {
        console.error('Error loading Product Banner:', err);
      }
    });
  }
}
