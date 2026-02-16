import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import category_data from 'src/app/shared/data/category-data';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { ICategoryType } from 'src/app/shared/types/category-d-t';
import { ProductService } from 'src/app/shared/services/product.service';
import { CategoryDTO } from 'src/app/shared/types/product-list-model';

@Component({
  selector: 'app-shop-category',
  templateUrl: './shop-category.component.html',
  styleUrls: ['./shop-category.component.scss']
})
export class ShopCategoryComponent implements OnInit {
  @Input() style_2:Boolean = false;
  @Input() style_3:Boolean = false;
  @Input() style_4:Boolean = false;
  @Input() shop_category_2:Boolean = false;
  public category_data:ICategoryType[] = category_data;

  constructor(
    public utilsService:UtilsService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    // Load categories from API when style_2 is true (home-style-2 page)
    if (this.style_2) {
      this.loadCategoriesFromAPI();
    }
  }

  /**
   * Load categories from API and transform to ICategoryType format
   */
  private loadCategoriesFromAPI(): void {
    this.productService.getAllCategories().subscribe({
      next: (categories: CategoryDTO[]) => {
        if (categories && categories.length > 0) {
          this.category_data = this.transformCategoriesToICategoryType(categories);
          // Analyze image brightness after data is set (only for style_2)
          if (this.style_2) {
            setTimeout(() => this.analyzeImageBrightness(), 100);
          }
        } else {
          // Fallback to static data if API returns empty
          this.category_data = category_data;
        }
      },
      error: (error) => {
        console.error('Error loading categories from API:', error);
        // Fallback to static data on error
        this.category_data = category_data;
      }
    });
  }

  /**
   * Transform CategoryDTO[] to ICategoryType[] format
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
        img: parent.image || undefined,
        parentTitle: parent.categoryName,
        children: children.length > 0 ? children : undefined
      };
    });
  }

  /**
   * Default banner image path
   */
  readonly DEFAULT_BANNER_IMAGE = 'assets/img/default-img/banner.png';

  /**
   * Get image URL or default if empty/null (for style_2, also use default if from assets folder)
   */
  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return this.DEFAULT_BANNER_IMAGE;
    }
    // For home-style-2, don't show images from assets folder (static data) - use default instead
    if (this.style_2) {
      const normalizedUrl = imageUrl.toLowerCase().trim();
      if (normalizedUrl.startsWith('/assets/') || normalizedUrl.startsWith('assets/')) {
        // Check if it's the default image path - allow it
        if (!normalizedUrl.includes('default-img')) {
          return this.DEFAULT_BANNER_IMAGE;
        }
      }
    }
    return imageUrl;
  }

  /**
   * Analyze image brightness and set isDark property for each category
   */
  private analyzeImageBrightness(): void {
    // Only analyze first 3 categories (the ones displayed in style_2)
    this.category_data.slice(0, 3).forEach((item) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            // Fallback: assume dark if canvas not supported
            item.isDark = true;
            this.cdr.detectChanges();
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Sample pixels from the image (sample every 10th pixel for performance)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let brightnessSum = 0;
          let pixelCount = 0;

          for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel (RGBA = 4 bytes)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Calculate brightness using relative luminance formula
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
            brightnessSum += brightness;
            pixelCount++;
          }

          const averageBrightness = brightnessSum / pixelCount;
          // If average brightness is above 128 (midpoint), image is light, use black text
          // If below 128, image is dark, use light/white text
          item.isDark = averageBrightness < 128;
          // Trigger change detection to update the view
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Error analyzing image brightness:', error);
          // Fallback: assume dark
          item.isDark = true;
          this.cdr.detectChanges();
        }
      };

      img.onerror = () => {
        // Fallback: assume dark if image fails to load
        item.isDark = true;
        this.cdr.detectChanges();
      };

      img.src = this.getImageUrl(item.img);
    });
  }
}
