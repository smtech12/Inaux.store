import { Component } from '@angular/core';
import menuData from 'src/app/shared/data/menu-data';
import { IMenuType } from 'src/app/shared/types/menu-d-t';
import { ProductService } from 'src/app/shared/services/product.service';
import { CategoryDTO } from 'src/app/shared/types/product-list-model';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-nav-manus',
  templateUrl: './nav-manus.component.html',
  styleUrls: ['./nav-manus.component.scss']
})
export class NavManusComponent {
  public menu_data: IMenuType[] = menuData;
  bg: string = '/assets/img/bg/mega-menu-bg.jpg';

  constructor(
    private productService: ProductService,
    private utilsService: UtilsService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (categories: CategoryDTO[]) => {
        if (categories && categories.length > 0) {
          const parentCategories = categories.filter(cat => !cat.parentCategoryId);
          const categoryMenu: IMenuType = {
            link: '/shop',
            title: 'Category',
            hasDropdown: true,
            megamenu: false, // Simple dropdown for categories based on previous hardcoded structure
            dropdownItems: parentCategories.map(cat => ({
              link: '/shop',
              title: cat.categoryName,
              queryParams: { category: this.utilsService.convertToURL(cat.categoryName), categoryId: cat.id }
            }))
          };

          // Try to insert after "Shop"
          const shopIndex = this.menu_data.findIndex(m => m.title === 'Shop');
          if (shopIndex !== -1) {
            // Remove existing "Category" if present (to avoid duplicates if called multiple times or if hardcoded one exists)
            const catIndex = this.menu_data.findIndex(m => m.title === 'Category');
            if (catIndex !== -1) {
              this.menu_data.splice(catIndex, 1);
            }
            // Re-find shop index in case splice shifted it (though unlikely as Category usually follows Shop)
            const newShopIndex = this.menu_data.findIndex(m => m.title === 'Shop');
            this.menu_data.splice(newShopIndex + 1, 0, categoryMenu);
          } else {
            this.menu_data.push(categoryMenu);
          }
        }
      },
      error: (error) => {
        console.error('Error loading categories for desktop menu:', error);
      }
    });
  }

  getMenuClasses(item: IMenuType): string {
    const classes = [];
    if (item.hasDropdown && !item.megamenu) {
      classes.push('active', 'has-dropdown');
    } else if (item.megamenu) {
      classes.push('mega-menu', 'has-dropdown');
    }
    return classes.join(' ');
  }
}
