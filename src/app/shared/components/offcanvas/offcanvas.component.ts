import { Component, OnInit } from '@angular/core';
import { UtilsService } from '../../services/utils.service';
import { IMobileMenu } from '../../types/menu-d-t';
import { mobile_menus } from '../../data/menu-data';
import { ProductService } from '../../services/product.service';
import { CategoryDTO } from '../../types/product-list-model';


@Component({
  selector: 'app-offcanvas',
  templateUrl: './offcanvas.component.html',
  styleUrls: ['./offcanvas.component.scss']
})


export class OffcanvasComponent implements OnInit {

  constructor(
    public utilsService: UtilsService,
    private productService: ProductService
  ) { }

  mobile_menus: IMobileMenu[] = [...mobile_menus];

  activeMenu: string = "";

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (categories: CategoryDTO[]) => {
        if (categories && categories.length > 0) {
          const parentCategories = categories.filter(cat => !cat.parentCategoryId);
          const categoryDropdown: IMobileMenu = {
            title: 'Categories',
            dropdownMenu: parentCategories.map(cat => ({
              title: cat.categoryName,
              link: '/shop',
              queryParams: {
                category: this.utilsService.convertToURL(cat.categoryName),
                categoryId: cat.id
              }
            }))
          };

          // Insert "Categories" after "Shop" (index 1)
          const shopIndex = this.mobile_menus.findIndex(m => m.title === 'Shop');
          if (shopIndex !== -1) {
            this.mobile_menus.splice(shopIndex + 1, 0, categoryDropdown);
          } else {
            this.mobile_menus.push(categoryDropdown);
          }
        }
      },
      error: (error) => {
        console.error('Error loading categories for mobile menu:', error);
      }
    });
  }

  handleOpenMenu(navTitle: string) {
    if (navTitle === this.activeMenu) {
      this.activeMenu = "";
    } else {
      this.activeMenu = navTitle;
    }
  }

}
