import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import product_data from '../data/product-data';
import { IProduct } from '../types/product-d-t';
import blog_data from '../data/blog-data';
import IBlogType from '../types/blog-d-t';
import { ApiResponseMessage, ProductListDTO, WebSectionDto, WebSectionItemDto, CategoryDTO, GetSectionResponseDto } from '../types/product-list-model';
import { ProductDetailDTO, ReviewDTO } from '../types/product-detail-model';
import { OrderTrackResponse } from '../types/order-history-model';
import { environment } from '../../../environments/environment';

const all_products = product_data;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = environment.API_BASE_URL + '/WebFront';

  public filter_offcanvas: boolean = false;
  public pageSize: number = 9;

  // Get Products
  public get products(): Observable<IProduct[]> {
    return of(product_data);
  }

  constructor(private http: HttpClient) { }

  activeImg: string | undefined;
  // Cache for current product detail DTO (for variant selection)
  private currentProductDetailDTO: ProductDetailDTO | null = null;
  // Cache for web sections to avoid duplicate API calls
  private webSectionsCache$: Observable<WebSectionDto[]> | null = null;
  // Cache for current product categoryId (for related products)
  private currentProductCategoryId: number | null = null;
  // Cache for categories
  private categoriesCache$: Observable<CategoryDTO[]> | null = null;
  // Cache for top featured products
  private topFeaturedProductsCache$: Observable<IProduct[]> | null = null;
  // Cache for product list
  private productListCache$: Observable<IProduct[]> | null = null;

  handleImageActive(img: string) {
    this.activeImg = img;
  }

  // Get current product detail DTO (for variant selection)
  getCurrentProductDetailDTO(): ProductDetailDTO | null {
    return this.currentProductDetailDTO;
  }

  // Get current product categoryId (for related products)
  getCurrentProductCategoryId(): number | null {
    return this.currentProductCategoryId;
  }

  // Get Products By id
  public getProductById(id: string): Observable<IProduct | undefined> {
    return this.products.pipe(map(items => {
      const product = items.find(p => Number(p.id) === Number(id));
      if (product) {
        this.handleImageActive(product.img)
      }
      return product;
    }));
  }
  // Get related Products (Legacy - using brand filter)
  public getRelatedProducts(productId: number, brand: string): Observable<IProduct[]> {
    return this.products.pipe(map(items => {
      return items.filter(
        (p) => p.brand.toLowerCase().includes(brand.toLowerCase()) &&
          p.id !== Number(productId)
      )
    }));
  }

  /**
   * Get related products by category ID from API
   * @param categoryId Category ID
   * @param excludeProductId Optional product ID to exclude from results (handled by backend)
   * @returns Observable of IProduct array
   */
  public getRelatedProductsByCategory(categoryId: number, excludeProductId?: number): Observable<IProduct[]> {
    if (!categoryId || categoryId <= 0) {
      console.warn('Invalid categoryId provided to getRelatedProductsByCategory');
      return of([]);
    }

    let params = new HttpParams().set('categoryId', categoryId.toString());

    // Add excludeProductId as query parameter if provided
    if (excludeProductId && excludeProductId > 0) {
      params = params.set('excludeProductId', excludeProductId.toString());
    }

    return this.http.get<ApiResponseMessage<ProductListDTO[]>>(`${this.baseUrl}/related-product`, { params })
      .pipe(
        map(response => {
          if (response && response.successData && Array.isArray(response.successData) && response.successData.length > 0) {
            // Backend already excludes the product, so just map the results
            return response.successData.map(product => this.mapProductListDTOToIProduct(product));
          }
          return [];
        }),
        catchError(error => {
          console.error('Error fetching related products from API:', error);
          return of([]);
        })
      );
  }
  // Get max price
  public get maxPrice(): number {
    const max_price = all_products.reduce((max, product) => {
      return product.price > max ? product.price : max;
    }, 0);
    return max_price
  }
  // shop filterSelect
  public filterSelect = [
    { value: 'asc', text: 'Default Sorting' },
    { value: 'low', text: 'Low to Hight' },
    { value: 'high', text: 'High to Low' },
    { value: 'on-sale', text: 'On Sale' },
  ];

  // Get Product Filter
  public filterProducts(): Observable<IProduct[]> {
    return this.products.pipe(map(product => {
      return product;
    }));
  }


  // Sorting Filter
  public sortProducts(products: IProduct[], payload: string): any {

    if (payload === 'a-z') {
      return products.sort((a, b) => a.title.localeCompare(b.title));
    } else if (payload === 'asc') {
      return products.sort((a, b) => {
        if (a.id < b.id) {
          return -1;
        } else if (a.id > b.id) {
          return 1;
        }
        return 0;
      })
    } else if (payload === 'sale') {
      return products.filter((p) => p.discount! > 0)
    } else if (payload === 'low') {
      return products.sort((a, b) => {
        if (a.price < b.price) {
          return -1;
        } else if (a.price > b.price) {
          return 1;
        }
        return 0;
      })
    } else if (payload === 'high') {
      return products.sort((a, b) => {
        if (a.price > b.price) {
          return -1;
        } else if (a.price < b.price) {
          return 1;
        }
        return 0;
      })
    }
  }

  /*
    ---------------------------------------------
    ------------- Product Pagination  -----------
    ---------------------------------------------
  */
  public getPager(totalItems: number, currentPage: number = 1, pageSize: number = 9) {
    // calculate total pages
    let totalPages = Math.ceil(totalItems / pageSize);

    // Paginate Range
    let paginateRange = 3;

    // ensure current page isn't out of range
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    let startPage: number, endPage: number;
    if (totalPages <= 5) {
      startPage = 1;
      endPage = totalPages;
    } else if (currentPage < paginateRange - 1) {
      startPage = 1;
      endPage = startPage + paginateRange - 1;
    } else {
      startPage = currentPage - 1;
      endPage = currentPage + 1;
    }

    // calculate start and end item indexes
    let startIndex = (currentPage - 1) * pageSize;
    let endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    // create an array of pages to ng-repeat in the pager control
    let pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

    // return object with all pager properties required by the view
    return {
      totalItems: totalItems,
      currentPage: currentPage,
      pageSize: pageSize,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      startIndex: startIndex,
      endIndex: endIndex,
      pages: pages
    };
  }

  // ============================================
  // API METHODS
  // ============================================

  /**
   * Get product list from API
   * @param categoryId Optional category filter
   * @returns Observable of IProduct array
   */
  /**
   * Get product list from API
   * @param categoryId Optional category filter
   * @returns Observable of IProduct array
   */
  public getProductListFromAPI(categoryId?: number | null): Observable<IProduct[]> {
    // If categoryId is present, call API directly (do not cache)
    if (categoryId != null && categoryId > 0) {
      let params = new HttpParams();
      params = params.set('categoryId', categoryId.toString());
      return this.fetchProductList(params);
    }

    // If no categoryId, use cache
    if (!this.productListCache$) {
      this.productListCache$ = this.fetchProductList(new HttpParams())
        .pipe(
          shareReplay(1)
        );
    }
    return this.productListCache$;
  }

  /**
   * Helper method to fetch product list
   */
  private fetchProductList(params: HttpParams): Observable<IProduct[]> {
    return this.http.get<ApiResponseMessage<ProductListDTO[]>>(`${this.baseUrl}/product-list`, { params })
      .pipe(
        map(response => {
          console.log('API Response:', response);
          if (response && response.successData && Array.isArray(response.successData) && response.successData.length > 0) {
            const mappedProducts = response.successData.map(product => this.mapProductListDTOToIProduct(product));
            console.log('Mapped Products:', mappedProducts);
            return mappedProducts;
          }
          console.warn('No products in response or empty array');
          return [];
        }),
        catchError(error => {
          console.error('Error fetching products from API:', error);
          // Fallback to static data on error
          return of(product_data);
        })
      );
  }

  /**
   * Clear product list cache
   */
  public clearProductListCache(): void {
    this.productListCache$ = null;
  }

  /**
   * Get products by category from API
   * @param categoryId Category ID (optional, if null returns all products)
   * @returns Observable of IProduct array
   */
  public getProductsByCategory(categoryId: number | null = null): Observable<IProduct[]> {
    let params = new HttpParams();
    if (categoryId != null && categoryId > 0) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<ApiResponseMessage<any[]>>(`${this.baseUrl}/product-by-category`, { params })
      .pipe(
        map(response => {
          console.log('Get Products By Category API Response:', response);
          if (response && response.successData && Array.isArray(response.successData) && response.successData.length > 0) {
            // Use mapFeaturedProductToIProduct since images is string array (same structure as featured products)
            const mappedProducts = response.successData.map(product => {
              const mapped = this.mapFeaturedProductToIProduct(product);
              // Override flags for category products (not all are trending/new)
              mapped.trending = product.discount > 0;
              mapped.new = false;
              return mapped;
            });
            console.log('Mapped Products By Category:', mappedProducts);
            return mappedProducts;
          }
          console.warn('No products in response or empty array');
          return [];
        }),
        catchError(error => {
          console.error('Error fetching products by category from API:', error);
          return of([]);
        })
      );
  }

  /**
   * Map ProductListDTO from API to IProduct interface
   * @param dto ProductListDTO from API
   * @returns IProduct object
   */
  private mapProductListDTOToIProduct(dto: ProductListDTO): IProduct {
    // Handle images - can be empty array
    const images = dto.images || [];
    const primaryImage = images.find(img => img.isPrimary) || images[0];
    const secondaryImage = images[1] || images[0];
    const allImageUrls = images.map(img => img.imageUrl).filter(url => url); // Filter out any empty URLs

    // Ensure at least one image URL (use empty string if no images)
    const defaultImageUrl = primaryImage?.imageUrl || '';

    return {
      id: dto.id,
      variantId: dto.variantId || undefined,
      isVariable: dto.isVariable || false,
      sku: dto.sku, // Include SKU from product list
      img: defaultImageUrl,
      thumb_img: secondaryImage?.imageUrl || defaultImageUrl,
      related_images: allImageUrls.length > 0 ? allImageUrls : (defaultImageUrl ? [defaultImageUrl] : ['']),
      title: dto.productName || '',
      description: dto.description || '', // Add description field
      price: dto.priceAfterDiscount || dto.sellingPrice,
      old_price: dto.discount > 0 ? dto.sellingPrice : undefined,
      discount: dto.discount > 0 ? dto.discount : undefined,
      priceAfterDiscount: dto.priceAfterDiscount,
      category: dto.categoryName || '',
      parentCategory: dto.categoryName || '',
      brand: '',
      sm_desc: '',
      sizes: [],
      colors: [],
      quantity: 0,
      rating: 0,
      trending: dto.discount > 0,
      new: false,
      topRated: false,
      bestSeller: false,
      banner: false,
      stockStatus: dto.stockStatus,
      details: {
        details_text: '',
        details_list: [],
        details_text_2: ''
      },
      reviews: []
    };
  }

  /**
   * Get product detail from API by ID
   * @param id Product ID
   * @returns Observable of IProduct
   */
  public getProductDetailById(id: number): Observable<IProduct> {
    console.log('ProductService: getProductDetailById called for product', id);
    const params = new HttpParams().set('id', id.toString());

    return this.http.get<ApiResponseMessage<ProductDetailDTO>>(`${this.baseUrl}/product-detail`, { params })
      .pipe(
        map(response => {
          console.log('ProductService: API response received for product', id);
          if (response && response.successData) {
            // Cache the raw DTO for variant selection
            this.currentProductDetailDTO = response.successData;
            // Cache categoryId for related products
            this.currentProductCategoryId = response.successData.categoryId || null;
            const mappedProduct = this.mapProductDetailDTOToIProduct(response.successData);
            console.log('ProductService: Product mapped successfully for product', id);
            if (mappedProduct) {
              this.handleImageActive(mappedProduct.img);
            }
            return mappedProduct;
          }
          throw new Error('Product not found');
        }),
        catchError(error => {
          console.error('ProductService: Error fetching product detail from API:', error);
          this.currentProductDetailDTO = null;
          this.currentProductCategoryId = null;
          throw error;
        })
      );
  }

  /**
   * Map ProductDetailDTO from API to IProduct interface
   * @param dto ProductDetailDTO from API
   * @returns IProduct object
   */
  private mapProductDetailDTOToIProduct(dto: ProductDetailDTO): IProduct {
    const images = dto.images || [];
    const primaryImage = images.find(img => img.isPrimary) || images[0];
    const secondaryImage = images[1] || images[0];
    const allImageUrls = images.map(img => img.imageUrl).filter(url => url);
    const defaultImageUrl = primaryImage?.imageUrl || '';

    // Extract sizes and colors from attributes using attributeName
    const sizes: string[] = [];
    const colors: string[] = [];

    if (dto.attributes && dto.attributes.length > 0) {
      dto.attributes.forEach(attr => {
        const attributeName = (attr.attributeName || '').toLowerCase();
        if (attr.attributeValues && attr.attributeValues.length > 0) {
          if (attributeName.includes('size')) {
            attr.attributeValues.forEach(val => {
              if (!sizes.includes(val)) sizes.push(val);
            });
          } else if (attributeName.includes('color') || attributeName.includes('colour')) {
            attr.attributeValues.forEach(val => {
              if (!colors.includes(val)) colors.push(val);
            });
          }
        }
      });
    }

    // Map reviews
    const reviews = (dto.reviews || []).map((review: ReviewDTO) => ({
      img: '', // API doesn't provide customer images
      name: review.customerName || 'Anonymous',
      time: this.formatReviewDate(review.reviewDate),
      rating: review.rating,
      review_desc: review.remarks || ''
    }));

    return {
      id: dto.id,
      sku: dto.sku, // Include SKU from product detail
      img: defaultImageUrl,
      thumb_img: secondaryImage?.imageUrl || defaultImageUrl,
      related_images: allImageUrls.length > 0 ? allImageUrls : (defaultImageUrl ? [defaultImageUrl] : ['']),
      title: dto.productName || '',
      price: dto.priceAfterDiscount || dto.sellingPrice,
      old_price: dto.discount > 0 ? dto.sellingPrice : undefined,
      discount: dto.discount > 0 ? dto.discount : undefined,
      priceAfterDiscount: dto.priceAfterDiscount,
      category: dto.categoryName || '',
      parentCategory: dto.categoryName || '',
      brand: dto.brandName || '',
      sm_desc: dto.description || '',
      sizes: sizes.length > 0 ? sizes : [],
      colors: colors.length > 0 ? colors : [],
      quantity: dto.stockUnits || dto.stockQuantity || 0,
      stockUnits: dto.stockUnits,
      stockQuantity: dto.stockQuantity,
      stockStatus: dto.stockStatus,
      rating: dto.averageRating || 0,
      trending: dto.discount > 0,
      new: false,
      topRated: false,
      bestSeller: false,
      banner: false,
      isVariable: dto.isVariable || false, // Include isVariable from API
      details: {
        details_text: dto.description || '',
        details_list: [], // Could parse description or use attributes
        details_text_2: dto.description || ''
      },
      reviews: reviews
    };
  }

  /**
   * Format review date to readable format
   * @param dateString ISO date string
   * @returns Formatted date string
   */
  private formatReviewDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 1) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} Days Ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} Weeks Ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} Months Ago`;
      return `${Math.floor(diffDays / 365)} Years Ago`;
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Get all web sections from API (cached to avoid duplicate calls)
   * @returns Observable of WebSectionDto array
   */
  public getAllSections(forceRefresh: boolean = false): Observable<WebSectionDto[]> {
    if (forceRefresh) {
      this.webSectionsCache$ = null;
    }
    // Return cached Observable if it exists, otherwise create and cache it
    if (!this.webSectionsCache$) {
      this.webSectionsCache$ = this.http.get<ApiResponseMessage<GetSectionResponseDto>>(`${this.baseUrl}/get-section`)
        .pipe(
          map(response => {
            console.log('Web Sections API Response:', response);
            if (response && response.successData && response.successData.sections && Array.isArray(response.successData.sections) && response.successData.sections.length > 0) {
              // Filter only active sections
              const activeSections = response.successData.sections.filter(section => section.isActive);
              console.log('Active Web Sections:', activeSections.map(s => s.sectionName));
              return activeSections;
            }
            console.warn('No web sections in response or empty array');
            return [];
          }),
          catchError(error => {
            console.error('Error fetching web sections from API:', error);
            return of([]);
          }),
          shareReplay(1) // Cache and share the result with all subscribers
        );
    }
    return this.webSectionsCache$;
  }

  /**
   * Clear web sections cache (useful if you need to refresh the data)
   */
  public clearWebSectionsCache(): void {
    this.webSectionsCache$ = null;
  }

  /**
   * Get banner section items from API
   * @returns Observable of WebSectionItemDto array (banner items)
   */
  public getBannerSectionItems(): Observable<WebSectionItemDto[]> {
    return this.getAllSections().pipe(
      map(sections => {
        // Find banner section by SectionKey or SectionName (case-insensitive)
        // Check if sectionKey contains "banner" or sectionName equals "banner"
        const bannerSection = sections.find(section => {
          const sectionKeyLower = section.sectionKey?.toLowerCase() || '';
          const sectionNameLower = section.sectionName?.toLowerCase() || '';
          return sectionKeyLower.includes('banner') || sectionNameLower === 'banner';
        });

        if (bannerSection && bannerSection.items && bannerSection.items.length > 0) {
          // Return only active items, sorted by DisplayOrder
          return bannerSection.items
            .filter(item => item.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder);
        }

        return [];
      })
    );
  }

  /**
   * Get header banner section items from API (for hero slider)
   * @returns Observable of WebSectionItemDto array (header banner items)
   */
  public getHeaderBannerItems(): Observable<WebSectionItemDto[]> {
    return this.getAllSections().pipe(
      map(sections => {
        // Find header banner section by sectionKey "header-banner" or sectionName "banner"
        const headerBannerSection = sections.find(section => {
          const sectionKeyLower = section.sectionKey?.toLowerCase() || '';
          const sectionNameLower = section.sectionName?.toLowerCase() || '';
          return sectionKeyLower === 'header-banner' ||
            sectionKeyLower.includes('header-banner') ||
            sectionNameLower === 'banner';
        });

        if (headerBannerSection && headerBannerSection.items && headerBannerSection.items.length > 0) {
          // Return only active items, sorted by DisplayOrder
          return headerBannerSection.items
            .filter(item => item.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder);
        }

        return [];
      })
    );
  }

  /**
   * Get all categories from API
   * @returns Observable of CategoryDTO array
   */
  public getAllCategories(): Observable<CategoryDTO[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http.get<ApiResponseMessage<CategoryDTO[]>>(`${this.baseUrl}/get-all-categories`)
        .pipe(
          map(response => {
            if (response && response.successData && Array.isArray(response.successData)) {
              return response.successData;
            }
            return [];
          }),
          catchError(error => {
            console.error('Error fetching categories from API:', error);
            return of([]);
          }),
          shareReplay(1)
        );
    }
    return this.categoriesCache$;
  }

  /**
   * Clear categories cache
   */
  public clearCategoriesCache(): void {
    this.categoriesCache$ = null;
  }

  /**
   * Get top featured/selling products from API
   * @param categoryId Optional category ID to filter featured products
   * @returns Observable of IProduct array (top 5 featured products)
   */
  public getTopFeaturedProducts(categoryId: number | null = null): Observable<IProduct[]> {
    // If categoryId is provided, fetch directly without using the global cache
    if (categoryId && categoryId > 0) {
      const params = new HttpParams().set('categoryId', categoryId.toString());
      return this.http.get<ApiResponseMessage<any[]>>(`${this.baseUrl}/get-top-featured-product`, { params })
        .pipe(
          map(response => {
            if (response && response.successData && Array.isArray(response.successData) && response.successData.length > 0) {
              return response.successData.map(product => this.mapFeaturedProductToIProduct(product));
            }
            return [];
          }),
          catchError(error => {
            console.error('Error fetching top featured products from API:', error);
            return of([]);
          })
        );
    }

    // Default behavior (no category): use cache
    if (!this.topFeaturedProductsCache$) {
      this.topFeaturedProductsCache$ = this.http.get<ApiResponseMessage<any[]>>(`${this.baseUrl}/get-top-featured-product`)
        .pipe(
          map(response => {
            if (response && response.successData && Array.isArray(response.successData) && response.successData.length > 0) {
              return response.successData.map(product => this.mapFeaturedProductToIProduct(product));
            }
            return [];
          }),
          catchError(error => {
            console.error('Error fetching top featured products from API:', error);
            return of([]);
          }),
          shareReplay(1)
        );
    }
    return this.topFeaturedProductsCache$;
  }

  /**
   * Clear top featured products cache
   */
  public clearTopFeaturedProductsCache(): void {
    this.topFeaturedProductsCache$ = null;
  }

  /**
   * Get product banner section items from API (for shop page title)
   * @returns Observable of WebSectionItemDto array (product banner items)
   */
  public getProductBannerSectionItems(): Observable<WebSectionItemDto[]> {
    return this.getAllSections().pipe(
      map(sections => {
        // Find product banner section by sectionName "Product Banner"
        const productBannerSection = sections.find(section => {
          const sectionNameLower = section.sectionName?.toLowerCase() || '';
          return sectionNameLower === 'product banner';
        });

        if (productBannerSection && productBannerSection.items && productBannerSection.items.length > 0) {
          // Return only active items, sorted by DisplayOrder
          return productBannerSection.items
            .filter(item => item.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder);
        }

        return [];
      })
    );
  }

  /**
   * Get section items by section name from API
   * @param sectionName The name of the section to retrieve
   * @returns Observable of WebSectionItemDto array
   */
  public getSectionItemsByName(sectionName: string, forceRefresh: boolean = false): Observable<WebSectionItemDto[]> {
    return this.getAllSections(forceRefresh).pipe(
      map(sections => {
        // Find section by sectionName (case-insensitive and trimmed)
        const targetSection = sections.find(section => {
          const sectionNameLower = (section.sectionName || '').trim().toLowerCase();
          const targetName = (sectionName || '').trim().toLowerCase();
          return sectionNameLower === targetName;
        });

        if (targetSection && targetSection.items && targetSection.items.length > 0) {
          // Return only active items, sorted by DisplayOrder
          return targetSection.items
            .filter(item => item.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder);
        }

        return [];
      })
    );
  }

  /**
   * Check if a section is active by name
   * @param sectionName The name of the section to check
   * @returns Observable of boolean (true if section is active)
   */
  public isSectionActive(sectionName: string): Observable<boolean> {
    return this.getAllSections().pipe(
      map(sections => {
        const targetName = (sectionName || '').trim().toLowerCase();
        return sections.some(section => {
          const name = (section.sectionName || '').trim().toLowerCase();
          return name === targetName;
        });
      })
    );
  }

  /**
   * Map Featured Product to IProduct interface
   * @param product Featured product from API (images can be array of objects or strings)
   * @returns IProduct object
   */
  private mapFeaturedProductToIProduct(product: any): IProduct {
    // Handle images - can be array of ProductImageDTO objects or strings
    const images = product.images || [];
    let primaryImage = '';
    let secondaryImage = '';
    let allImageUrls: string[] = [];

    if (images.length > 0) {
      // Check if images are objects (ProductImageDTO) or strings
      if (typeof images[0] === 'object' && images[0].imageUrl) {
        // Images are objects with imageUrl property
        const primaryImageObj = images.find((img: any) => img.isPrimary) || images[0];
        const secondaryImageObj = images[1] || images[0];
        primaryImage = primaryImageObj.imageUrl || '';
        secondaryImage = secondaryImageObj.imageUrl || '';
        allImageUrls = images.map((img: any) => img.imageUrl).filter((url: string) => url && url.trim() !== '');
      } else {
        // Images are strings (URLs)
        primaryImage = images[0] || '';
        secondaryImage = images[1] || images[0] || '';
        allImageUrls = images.filter((url: string) => url && url.trim() !== '');
      }
    }

    return {
      id: product.id,
      img: primaryImage,
      thumb_img: secondaryImage,
      title: product.productName || '',
      description: product.description || '', // Add description field
      price: product.priceAfterDiscount || product.sellingPrice || 0,
      old_price: product.discount > 0 ? product.sellingPrice : undefined,
      discount: product.discount > 0 ? product.discount : undefined,
      rating: product.averageRating || 0,
      status: product.stockStatus || 'Out of Stock',
      quantity: product.stockQuantity || 0,
      related_images: allImageUrls.length > 0 ? allImageUrls : (primaryImage ? [primaryImage] : []),
      sizes: [], // Not provided in API
      colors: [], // Not provided in API
      parentCategory: product.categoryName || '',
      category: product.categoryName || '',
      brand: product.brandName || '',
      sm_desc: '',
      trending: true, // All featured products are trending
      new: true, // Mark as new for featured products
      topRated: false,
      bestSeller: false,
      banner: false,
      details: {
        details_text: '',
        details_list: [],
        details_text_2: ''
      },
      reviews: []
    };
  }

  /**
   * Track order by transaction number
   * @param transactionNumber The transaction number to track
   * @returns Observable of order tracking data
   */
  trackOrder(transactionNumber: string): Observable<ApiResponseMessage<OrderTrackResponse>> {
    const params = new HttpParams().set('transactionNumber', transactionNumber);

    return this.http.get<ApiResponseMessage<OrderTrackResponse>>(
      `${this.baseUrl}/order-track`,
      { params }
    );
  }
}
