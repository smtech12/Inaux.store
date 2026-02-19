import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
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
export class ShopCategoryComponent implements OnInit, AfterViewInit {
  @Input() style_2: Boolean = false;
  @Input() style_3: Boolean = false;
  @Input() style_4: Boolean = false;
  @Input() shop_category_2: Boolean = false;
  public category_data: ICategoryType[] = category_data;
  private swiperInstance: Swiper | undefined;
  private dataLoaded = false;
  private viewReady = false;

  constructor(
    public utilsService: UtilsService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.style_2) {
      this.loadCategoriesFromAPI();
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryInitSwiper();
  }

  private tryInitSwiper(): void {
    if (!this.viewReady) return;
    if (!this.style_2 || this.dataLoaded) {
      setTimeout(() => this.initSwiper(), 100);
    }
  }

  private initSwiper(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = undefined;
    }
    this.swiperInstance = new Swiper('.category-swiper', {
      modules: [Navigation],
      slidesPerView: 3,
      spaceBetween: 30,
      loop: true,
      navigation: {
        nextEl: '.category-swiper-next',
        prevEl: '.category-swiper-prev',
      },
      breakpoints: {
        1200: { slidesPerView: 3 },
        992:  { slidesPerView: 3 },
        768:  { slidesPerView: 2 },
        576:  { slidesPerView: 1 },
        0:    { slidesPerView: 1 },
      },
    });
  }

  private loadCategoriesFromAPI(): void {
    this.productService.getAllCategories().subscribe({
      next: (categories: CategoryDTO[]) => {
        if (categories && categories.length > 0) {
          this.category_data = this.transformCategoriesToICategoryType(categories);
          setTimeout(() => this.analyzeImageBrightness(), 50);
        } else {
          this.category_data = category_data;
        }
        this.dataLoaded = true;
        this.tryInitSwiper();
      },
      error: (error) => {
        console.error('Error loading categories from API:', error);
        this.category_data = category_data;
        this.dataLoaded = true;
        this.tryInitSwiper();
      }
    });
  }

  private transformCategoriesToICategoryType(categories: CategoryDTO[]): ICategoryType[] {
    const parentCategories = categories.filter(cat => !cat.parentCategoryId);
    return parentCategories.map(parent => {
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

  readonly DEFAULT_BANNER_IMAGE = 'assets/img/default-img/banner.png';

  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl || imageUrl.trim() === '') return this.DEFAULT_BANNER_IMAGE;
    if (this.style_2) {
      const normalizedUrl = imageUrl.toLowerCase().trim();
      if (normalizedUrl.startsWith('/assets/') || normalizedUrl.startsWith('assets/')) {
        if (!normalizedUrl.includes('default-img')) return this.DEFAULT_BANNER_IMAGE;
      }
    }
    return imageUrl;
  }

  private analyzeImageBrightness(): void {
    this.category_data.forEach((item) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) { item.isDark = true; this.cdr.detectChanges(); return; }
          canvas.width = img.width; canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let brightnessSum = 0, pixelCount = 0;
          for (let i = 0; i < data.length; i += 40) {
            brightnessSum += (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
            pixelCount++;
          }
          item.isDark = (brightnessSum / pixelCount) < 128;
          this.cdr.detectChanges();
        } catch { item.isDark = true; this.cdr.detectChanges(); }
      };
      img.onerror = () => { item.isDark = true; this.cdr.detectChanges(); };
      img.src = this.getImageUrl(item.img);
    });
  }
}
