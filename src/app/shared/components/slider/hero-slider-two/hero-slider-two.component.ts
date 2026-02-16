import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import Swiper from 'swiper';
import { IHeroSlider } from 'src/app/shared/types/hero-slider-t';
import { EffectFade, Pagination } from 'swiper/modules';
import { ProductService } from 'src/app/shared/services/product.service';

@Component({
  selector: 'app-hero-slider-two',
  templateUrl: './hero-slider-two.component.html',
  styleUrls: ['./hero-slider-two.component.scss']
})
export class HeroSliderTwoComponent implements OnInit {

  @ViewChild('heroSliderContainer') heroSliderContainer!: ElementRef;
  public swiperInstance: Swiper | undefined;
  public hero_slider_data: IHeroSlider[] = []; // Start empty, only use API data

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  private dataLoaded: boolean = false;

  /**
   * Default banner image path
   */
  readonly DEFAULT_BANNER_IMAGE = 'assets/img/default-img/banner.png';

  /**
   * Get image URL or default if empty/null
   */
  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return this.DEFAULT_BANNER_IMAGE;
    }
    return imageUrl;
  }

  /**
   * Check if URL is external (starts with http:// or https://)
   */
  isExternalUrl(url: string | undefined): boolean {
    if (!url || url.trim() === '' || url === '#') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  }

  /**
   * Check if item has a valid redirect URL
   */
  hasValidRedirectUrl(item: IHeroSlider): boolean {
    const url = item.redirectUrl;
    return !!(url && url.trim() !== '' && url !== '#');
  }

  /**
   * Get the link for item - returns routerLink array for internal or href string for external
   */
  getItemLink(item: IHeroSlider): any[] | string {
    const redirectUrl = item.redirectUrl;
    // If redirectUrl is empty or '#', return '#'
    if (!redirectUrl || redirectUrl === '#') {
      return '#';
    }
    // Check if external URL
    if (this.isExternalUrl(redirectUrl)) {
      return redirectUrl;
    }
    // Internal route
    return [redirectUrl];
  }

  /**
   * Analyze image brightness and set isDark property
   */
  private analyzeImageBrightness(): void {
    this.hero_slider_data.forEach((item, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback: assume dark if canvas not supported
            item.isDark = true;
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
        }
      };

      img.onerror = () => {
        // Fallback: assume dark if image fails to load
        item.isDark = true;
        this.cdr.detectChanges();
      };

      img.src = this.getImageUrl(item.bgImg);
    });
  }

  ngOnInit(): void {
    this.loadHeroSliderData();
  }

  /**
   * Load hero slider data from WebSection API
   */
  private loadHeroSliderData(): void {
    this.productService.getSectionItemsByName('Banner').subscribe({
      next: (items) => {
        if (items && items.length > 0) {
          // Map WebSectionItemDto to IHeroSlider
          this.hero_slider_data = items.map((item, index) => ({
            id: item.id,
            bgImg: item.imageUrl || this.DEFAULT_BANNER_IMAGE,
            title: item.title || '',
            subtitle: item.subtitle || '',
            isDark: false, // Will be set dynamically based on image brightness
            redirectUrl: (item.redirectUrl && item.redirectUrl.trim() !== '')
              ? item.redirectUrl
              : '#'
          }));
          // Analyze image brightness after data is set
          setTimeout(() => this.analyzeImageBrightness(), 100);
        } else {
          console.log('No header banner items found in API response');
          // Show default banner image when API returns no data
          this.hero_slider_data = [{
            id: 0,
            bgImg: this.DEFAULT_BANNER_IMAGE,
            title: '',
            subtitle: '',
            isDark: false,
            redirectUrl: '#'
          }];
        }
        this.dataLoaded = true;
        // Initialize Swiper after view is ready
        this.initializeSwiperIfReady();
      },
      error: (error) => {
        console.error('Error loading header banner data:', error);
        // Show default banner image when API fails
        this.hero_slider_data = [{
          id: 0,
          bgImg: this.DEFAULT_BANNER_IMAGE,
          title: '',
          subtitle: '',
          isDark: false,
          redirectUrl: '#'
        }];
        this.dataLoaded = true;
        this.initializeSwiperIfReady();
      }
    });
  }

  /**
   * Initialize Swiper instance only when both view and data are ready
   */
  private initializeSwiperIfReady(): void {
    if (this.dataLoaded && this.heroSliderContainer) {
      this.initSwiper();
    }
  }

  /**
   * Initialize Swiper instance
   */
  private initSwiper(): void {
    if (!this.heroSliderContainer) {
      return;
    }

    // Destroy existing instance if any
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = undefined;
    }

    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      if (this.heroSliderContainer && this.heroSliderContainer.nativeElement) {
        try {
          this.swiperInstance = new Swiper(this.heroSliderContainer.nativeElement, {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: false,
            effect: 'fade',
            modules: [Pagination, EffectFade],
            pagination: {
              clickable: true,
              el: '.tp-slider-dot-2'
            },
          });
        } catch (error) {
          console.error('Error initializing Swiper:', error);
        }
      }
    }, 100);
  }

  ngAfterViewInit() {
    // Initialize Swiper if data is already loaded
    this.initializeSwiperIfReady();
  }
}
