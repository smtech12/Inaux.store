import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import category_data from 'src/app/shared/data/category-data';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { ICategoryType } from 'src/app/shared/types/category-d-t';
import { ProductService } from 'src/app/shared/services/product.service';
import { CategoryDTO } from 'src/app/shared/types/product-list-model';

@Component({
  selector: 'app-category-filter',
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss'],
})
export class CategoryFilterComponent implements OnInit {
  public categoryData: ICategoryType[] = category_data;
  public category: string | null = null;
  public subcategory: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public utilsService: UtilsService,
    private productService: ProductService
  ) {
    this.route.queryParams.subscribe((params) => {
      this.category = params['category'] ? params['category'] : null;
      this.subcategory = params['subcategory'] ? params['subcategory'] : null;
    });
  }

  ngOnInit(): void {
    // Load categories from API (without images for shop page)
    this.loadCategoriesFromAPI();
  }

  /**
   * Load categories from API and transform to ICategoryType format (without images)
   */
  private loadCategoriesFromAPI(): void {
    this.productService.getAllCategories().subscribe({
      next: (categories: CategoryDTO[]) => {
        if (categories && categories.length > 0) {
          this.categoryData = this.transformCategoriesToICategoryType(categories);
        } else {
          // Fallback to static data if API returns empty
          this.categoryData = category_data;
        }
      },
      error: (error) => {
        console.error('Error loading categories from API:', error);
        // Fallback to static data on error
        this.categoryData = category_data;
      }
    });
  }

  /**
   * Transform CategoryDTO[] to ICategoryType[] format (without images)
   * Groups categories by parent and creates children arrays
   */
  private transformCategoriesToICategoryType(categories: CategoryDTO[]): ICategoryType[] {
    // Find parent categories (where parentCategoryId is null)
    const parentCategories = categories.filter(cat => !cat.parentCategoryId);
    
    // Transform parent categories to ICategoryType format
    return parentCategories.map(parent => {
      // Find children of this parent
      const children = categories
        .filter(cat => cat.parentCategoryId === parent.id)
        .map(cat => cat.categoryName);
      
      return {
        id: parent.id,
        // No image for shop page sidebar
        img: undefined,
        parentTitle: parent.categoryName,
        children: children.length > 0 ? children : undefined
      };
    });
  }

  public handleParentCategory(categoryValue: string): void {
    // Find the category ID from categoryData
    const category = this.categoryData.find(cat => cat.parentTitle === categoryValue);
    const categoryId = category?.id;
    
    const currentQueryParams = this.route.snapshot.queryParams; // Get current query parameters
    const queryParams: any = {
      ...currentQueryParams, // Keep the existing query parameters
      category: this.utilsService.convertToURL(categoryValue),
    };
    
    if (categoryId) {
      queryParams.categoryId = categoryId;
    }
    
    this.router.navigate(['/shop'], { queryParams });
  }

  public handleSubCategory(subcategoryValue: string): void {
    // Find the category ID from categoryData (check children)
    let categoryId: number | undefined;
    for (const parent of this.categoryData) {
      const child = parent.children?.find(child => child === subcategoryValue);
      if (child) {
        // Find the child category ID - we need to get it from the API categories
        // For now, we'll use the parent ID as a fallback, or we could store child IDs
        // This is a limitation - subcategories don't have IDs stored in ICategoryType
        // If needed, we could enhance ICategoryType to include child IDs
        break;
      }
    }
    
    const currentQueryParams = this.route.snapshot.queryParams; // Get current query parameters
    const queryParams: any = {
      ...currentQueryParams, // Keep the existing query parameters
      subcategory: this.utilsService.convertToURL(subcategoryValue),
    };
    
    // Note: Subcategory ID lookup would require enhanced data structure
    // For now, subcategory filtering works by name (frontend filtering)
    
    this.router.navigate(['/shop'], { queryParams });
  }
}
