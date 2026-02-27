import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { IProduct } from '../../types/product-d-t';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { LoaderService } from '../../services/loader.service';
import { TenantService } from '../../services/tenant.service';
import {
  ProductDetailDTO,
  ProductAttributeDTO,
  VariantDTO,
} from '../../types/product-detail-model';
import { WebSectionItemDto } from '../../types/product-list-model';

@Component({
  selector: 'app-product-details-upper',
  templateUrl: './product-details-upper.component.html',
  styleUrls: ['./product-details-upper.component.scss'],
})
export class ProductDetailsUpperComponent implements OnInit, OnChanges, OnDestroy {
  @Input() product!: IProduct;
  @Input() bottomShow: boolean = true;
  @Input() style_2: boolean = false;
  @Input() modalMode: 'cart' | 'wishlist' = 'cart';

  public productDetailDTO: ProductDetailDTO | null = null;
  public selectedAttributes: { [key: number | string]: string } = {};
  public availableAttributes: ProductAttributeDTO[] = [];
  public variants: VariantDTO[] = [];
  public selectedVariant: VariantDTO | null = null;
  public contactPhone: string | null = null;
  public orderedDate: string = '';
  public orderReadyStartDate: string = '';
  public orderReadyEndDate: string = '';
  public deliveryStartDate: string = '';
  public deliveryEndDate: string = '';
  private originalRelatedImages: string[] = []; // Store original thumbnail images
  private isInitialized: boolean = false; // Flag to prevent duplicate initialization

  // Countdown timer properties
  public countdownTime: string = '';
  public showCountdown: boolean = false;
  private countdownInterval: any = null;
  private saleEndDate: Date | null = null;

  // Size guide modal properties
  public showSizeGuideModal: boolean = false;
  public sizeGuideItems: WebSectionItemDto[] = [];
  public sizeGuideLoading: boolean = false;

  constructor(
    public productService: ProductService,
    public cartService: CartService,
    private toastrService: ToastrService,
    public wishlistService: WishlistService,
    private loaderService: LoaderService,
    private tenantService: TenantService,
    private router: Router
  ) { }

  ngOnInit() {
    this.sanitizeProductDescription();
    this.initializeProduct();
    this.loadContactPhone();
    this.calculateDeliveryDates();
    this.initializeCountdownTimer();
  }

  ngOnDestroy() {
    // Clear countdown timer interval when component is destroyed
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /**
   * Get array for star iteration (0 to 4)
   */
  getStarArray(): number[] {
    return [0, 1, 2, 3, 4];
  }

  /**
   * Get star class based on rating and index
   * @param index Star index (0-4)
   * @param rating Average rating
   */
  getStarClass(index: number, rating: number): string {
    if (rating >= index + 1) {
      return 'fas fa-star'; // Full star
    } else if (rating > index && rating < index + 1) {
      return 'fas fa-star-half-alt'; // Half star
    } else {
      return 'fal fa-star'; // Empty star (using 'fal' for light/empty style)
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product'] && changes['product'].currentValue) {
      this.sanitizeProductDescription();
      // Only reinitialize if the product ID has actually changed
      const currentProduct = changes['product'].currentValue;
      const previousProduct = changes['product'].previousValue;

      if (!previousProduct || currentProduct.id !== previousProduct.id) {
        this.isInitialized = false; // Reset flag for new product
        this.initializeProduct();
      }
    }
  }

  private sanitizeProductDescription() {
    if (this.product) {
      if (this.product.sm_desc) {
        this.product.sm_desc = this.product.sm_desc.replace(/&nbsp;/g, ' ');
      }
      if (this.product.details) {
        if (this.product.details.details_text) {
          this.product.details.details_text = this.product.details.details_text.replace(/&nbsp;/g, ' ');
        }
        if (this.product.details.details_text_2) {
          this.product.details.details_text_2 = this.product.details.details_text_2.replace(/&nbsp;/g, ' ');
        }
        if (this.product.details.details_list && Array.isArray(this.product.details.details_list)) {
          this.product.details.details_list = this.product.details.details_list.map(item => item.replace(/&nbsp;/g, ' '));
        }
      }
    }
  }

  /**
   * Load contact phone number from tenant service
   */
  private loadContactPhone(): void {
    this.tenantService.getTenantHeaderInfo().subscribe({
      next: (tenantInfo) => {
        if (tenantInfo && tenantInfo.tenantHeader) {
          this.contactPhone = tenantInfo.tenantHeader.contactPhone;
          console.log('Contact phone loaded:', this.contactPhone);
        }
      },
      error: (error) => {
        console.error('Error loading contact phone:', error);
        // Set fallback phone number if API fails
        this.contactPhone = '03212482592';
      }
    });
  }

  /**
   * Open WhatsApp with pre-filled message
   */
  openWhatsApp(): void {
    // Use the contact phone from API or fallback
    let phoneNumber = this.contactPhone;

    // If no phone number is loaded, use fallback
    if (!phoneNumber) {
      phoneNumber = '03212482592';
      console.log('Using fallback phone number:', phoneNumber);
    }

    // Format Pakistani phone number for WhatsApp
    // Remove leading 0 and add country code 92
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('92')) {
      cleanPhone = '92' + cleanPhone;
    }

    const productTitle = this.product?.title || 'Product';
    const productUrl = window.location.href;

    // Determine SKU and Attributes
    let sku = this.product?.sku || 'N/A';
    let attributesText = '';

    // Check for selected attributes and variant SKU
    if (this.hasAttributes()) {
      // Build attributes string
      const parts: string[] = [];

      // API Attributes
      if (this.availableAttributes && this.availableAttributes.length > 0) {
        this.availableAttributes.forEach(attr => {
          const val = this.selectedAttributes[attr.attributeId];
          if (val) {
            parts.push(`${attr.attributeName}: ${val}`);
          }
        });
      }

      // Fallback attributes (Size/Color)
      if (this.selectedAttributes['size']) {
        parts.push(`Size: ${this.selectedAttributes['size']}`);
      }
      if (this.selectedAttributes['color']) {
        parts.push(`Color: ${this.selectedAttributes['color']}`);
      }

      if (parts.length > 0) {
        attributesText = parts.join(', ');
      }

      // Try to find variant SKU if attributes are selected
      if (this.productDetailDTO?.isVariable) {
        const match = this.findMatchingVariant();
        if (match && match.sku) {
          sku = match.sku;
        }
      }
    }

    let message = `I need some information related to products.\n\nWaiting for your quick response.`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    console.log('WhatsApp URL:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Buy Now: Add to cart and navigate to checkout
   */
  buyNow(): void {
    // If product has attributes (regardless of isVariable), require all attributes to be selected
    if (this.hasAttributes()) {
      if (!this.areAllAttributesSelected()) {
        const missingAttrs = this.getMissingAttributes();
        const missingList =
          missingAttrs.length > 0
            ? missingAttrs.join(', ')
            : 'all required attributes';
        this.toastrService.error(
          `Please select ${missingList} before buying`,
        );
        return;
      }
    }

    // Find matching variant if product is variable and has attributes
    let variantId: number | undefined = undefined;
    let variantSku: string | undefined = undefined;
    let variantPrice: number | undefined = undefined;
    let selectedAttrs: { [key: number | string]: string } | undefined =
      undefined;
    let attributeNames: { [key: number | string]: string } | undefined =
      undefined;

    if (this.productDetailDTO?.isVariable && this.hasAttributes()) {
      const matchingVariant = this.findMatchingVariant();

      if (!matchingVariant) {
        this.toastrService.error('Please select valid variant attributes');
        return;
      }

      // Prevent buying if selected variant is out of stock
      if (
        (matchingVariant.stockUnits === 0 || matchingVariant.stockUnits === undefined) &&
        (matchingVariant.stockQuantity === 0 || matchingVariant.stockQuantity === undefined)
      ) {
        this.toastrService.error('Selected variant is out of stock');
        return;
      }

      variantId = matchingVariant.variantId;
      variantSku = matchingVariant.sku;
      variantPrice = matchingVariant.price; // Use variant price

      // Store selected attributes - convert to object with attribute IDs as keys
      selectedAttrs = {};
      attributeNames = {};
      Object.entries(this.selectedAttributes).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          selectedAttrs![key] = value;
          // Find attribute name from availableAttributes
          const attribute = this.availableAttributes.find(
            (attr) => attr.attributeId.toString() === key.toString(),
          );
          if (attribute && attribute.attributeName) {
            attributeNames![key] = attribute.attributeName;
          }
        }
      });
    } else if (this.hasAttributes()) {
      // For non-variable products with attributes, still store selected attributes
      selectedAttrs = {};
      attributeNames = {};
      Object.entries(this.selectedAttributes).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          selectedAttrs![key] = value;
          // Find attribute name from availableAttributes
          const attribute = this.availableAttributes.find(
            (attr) => attr.attributeId.toString() === key.toString(),
          );
          if (attribute && attribute.attributeName) {
            attributeNames![key] = attribute.attributeName;
          }
        }
      });
    }

    // Calculate unit price: variant price - (variant price * discount / 100)
    // Get discount from product (header level)
    const productDiscount = this.product.discount || 0;
    let calculatedPriceAfterDiscount: number;

    if (variantPrice !== undefined) {
      // Calculate: variant price - (variant price * discount / 100)
      calculatedPriceAfterDiscount =
        variantPrice - (variantPrice * productDiscount) / 100;
    } else {
      // For non-variable products, use existing priceAfterDiscount or calculate from price
      calculatedPriceAfterDiscount =
        this.product.priceAfterDiscount !== undefined
          ? this.product.priceAfterDiscount
          : this.product.discount && this.product.discount > 0
            ? this.product.price -
            (this.product.price * this.product.discount) / 100
            : this.product.price;
    }

    // Create a copy of the product with variant information
    const productToAdd: IProduct = {
      ...this.product,
      variantId: variantId,
      sku: variantSku || this.product.sku,
      selectedAttributes: selectedAttrs,
      attributeNames: attributeNames,
      // Use variant price as base price if available, otherwise keep product price
      price: variantPrice !== undefined ? variantPrice : this.product.price,
      // Calculate priceAfterDiscount: variant price - (variant price * discount / 100)
      priceAfterDiscount: calculatedPriceAfterDiscount,
    };

    // Add to cart with variant information (openSidebar = false to skip cart hover)
    this.cartService.addCartProduct(productToAdd, variantId, false);

    // Navigate to checkout
    this.router.navigate(['/checkout']);
  }

  /**
   * Calculate dynamic delivery dates based on current date
   */
  private calculateDeliveryDates(): void {
    const today = new Date();

    // Ordered: Current date
    this.orderedDate = this.formatDate(today);

    // Order Ready: Current date to current date + 1 day
    this.orderReadyStartDate = this.formatDate(today);
    const orderReadyEnd = new Date(today);
    orderReadyEnd.setDate(today.getDate() + 1);
    this.orderReadyEndDate = this.formatDate(orderReadyEnd);

    // Delivery: Current date + 2 to + 6 days
    const deliveryStart = new Date(today);
    deliveryStart.setDate(today.getDate() + 2);
    this.deliveryStartDate = this.formatDate(deliveryStart);

    const deliveryEnd = new Date(today);
    deliveryEnd.setDate(today.getDate() + 6);
    this.deliveryEndDate = this.formatDate(deliveryEnd);
  }

  /**
   * Format date to readable format (e.g., "Feb 2, 2026")
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Open size guide modal or page
   */
  openSizeGuide(): void {
    // You can implement this to open a modal or navigate to size guide page
    // For now, let's show a toast notification
    this.toastrService.info('Size guide coming soon!');
  }

  /**
   * Initialize countdown timer for sale ending
   */
  private initializeCountdownTimer(): void {
    // Set sale end date to midnight tonight
    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(23, 59, 59, 999); // Set to 23:59:59 tonight

    this.saleEndDate = tonight;

    // Start countdown timer
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000); // Update every second
  }

  /**
   * Update countdown timer display
   */
  private updateCountdown(): void {
    if (!this.saleEndDate) {
      this.showCountdown = false;
      return;
    }

    const now = new Date().getTime();
    const endTime = this.saleEndDate.getTime();
    const timeDifference = endTime - now;

    if (timeDifference <= 0) {
      // Sale has ended
      this.showCountdown = false;
      this.countdownTime = 'Sale Ended';
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      return;
    }

    // Calculate time units
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    // Show countdown only if sale ends within 24 hours
    if (days < 1) {
      this.showCountdown = true;

      if (hours === 0 && minutes === 0) {
        // Show only seconds if less than 1 minute
        this.countdownTime = `Sale ends in ${seconds}s`;
      } else if (hours === 0) {
        // Show minutes and seconds if less than 1 hour
        this.countdownTime = `Sale ends in ${minutes}m ${seconds}s`;
      } else {
        // Show hours, minutes and seconds for same day
        this.countdownTime = `Sale ends in ${hours}h ${minutes}m ${seconds}s`;
      }
    } else {
      this.showCountdown = false;
    }
  }

  /**
   * Open size guide modal with size guide data from API
   */
  openSizeGuideModal(): void {
    this.showSizeGuideModal = true;
    this.sizeGuideLoading = true;

    // Load size guide from web sections API
    this.productService.getSectionItemsByName('Size Guide').subscribe({
      next: (items) => {
        this.sizeGuideItems = items;
        this.sizeGuideLoading = false;
        console.log('Size guide items loaded:', items);
      },
      error: (error) => {
        console.error('Error loading size guide:', error);
        this.sizeGuideLoading = false;
        this.toastrService.error('Failed to load size guide');
      }
    });
  }

  /**
   * Close size guide modal
   */
  closeSizeGuideModal(): void {
    this.showSizeGuideModal = false;
  }

  /**
   * Initialize product data and load product detail DTO
   */
  private initializeProduct() {
    if (!this.product) {
      console.log('ProductDetailsUpper: No product provided');
      return;
    }

    if (this.isInitialized) {
      console.log('ProductDetailsUpper: Already initialized for product', this.product.id);
      return;
    }

    console.log('ProductDetailsUpper: Initializing product', this.product.id);
    this.isInitialized = true; // Set flag immediately to prevent race conditions

    this.productService.activeImg = this.product.img;
    // Store original thumbnail images - don't modify these
    this.originalRelatedImages = [...this.product.related_images];
    // Get the cached product detail DTO for variant selection
    this.productDetailDTO = this.productService.getCurrentProductDetailDTO();

    // Check if cached DTO matches current product
    if (this.productDetailDTO && this.productDetailDTO.id === this.product.id) {
      console.log('ProductDetailsUpper: Using cached data for product', this.product.id);
      this.availableAttributes = this.productDetailDTO.attributes || [];
      this.variants = this.productDetailDTO.variants || [];
      // If API provided a current variant selection, apply it
      if (
        this.productDetailDTO.currentVariantAttributes &&
        this.productDetailDTO.currentVariantAttributes.length > 0
      ) {
        this.selectedAttributes = {};
        this.productDetailDTO.currentVariantAttributes.forEach((attr) => {
          this.selectedAttributes[attr.attributeId] = attr.attributeValue;
        });
        this.updateVariantImages();
        this.updateSelectedVariant();
      }
      // Hide loader when using cached data
      this.loaderService.hide();
    } else {
      console.log('ProductDetailsUpper: Fetching fresh data for product', this.product.id);
      // If productDetailDTO is not cached or doesn't match, fetch it
      this.productService.getProductDetailById(this.product.id).subscribe({
        next: (fullProduct) => {
          console.log('ProductDetailsUpper: API call completed for product', this.product.id);
          // The product detail DTO should now be cached
          this.productDetailDTO = this.productService.getCurrentProductDetailDTO();
          if (this.productDetailDTO && this.productDetailDTO.id === this.product.id) {
            this.availableAttributes = this.productDetailDTO.attributes || [];
            this.variants = this.productDetailDTO.variants || [];
            if (
              this.productDetailDTO.currentVariantAttributes &&
              this.productDetailDTO.currentVariantAttributes.length > 0
            ) {
              this.selectedAttributes = {};
              this.productDetailDTO.currentVariantAttributes.forEach((attr) => {
                this.selectedAttributes[attr.attributeId] = attr.attributeValue;
              });
              this.updateVariantImages();
              this.updateSelectedVariant();
            }
          }
          // Hide loader when product is loaded
          this.loaderService.hide();
        },
        error: (error) => {
          console.error('ProductDetailsUpper: Error fetching product details:', error);
          // Hide loader on error
          this.loaderService.hide();
        }
      });
    }
  }

  /**
   * Handle attribute selection change
   * Allows toggling - if same value is clicked, deselect it
   * Supports both numeric attributeId (from API) and string keys (for fallback)
   */
  onAttributeChange(attributeId: number | string, value: string) {
    // Toggle: if same value is selected, deselect it
    if (this.selectedAttributes[attributeId] === value) {
      delete this.selectedAttributes[attributeId];
    } else {
      this.selectedAttributes[attributeId] = value;
    }
    this.updateVariantImages();
    this.updateSelectedVariant();
  }

  /**
   * Update the `selectedVariant` based on currently selected attributes
   */
  private updateSelectedVariant() {
    const match = this.findMatchingVariant();
    this.selectedVariant = match;
  }

  private isVariantOutOfStock(variant: VariantDTO | null | undefined): boolean {
    if (!variant) return false;
    if (variant.stockStatus === 'In Stock') return false;
    if (variant.stockStatus === 'Out of Stock') return true;
    return (
      (variant.stockUnits === 0 || variant.stockUnits === undefined) &&
      (variant.stockQuantity === 0 || variant.stockQuantity === undefined)
    );
  }

  /**
   * Determine whether Add/Buy actions should be treated as out of stock
   */
  public isOutOfStockForActions(): boolean {
    // Variable product: require a selected matching variant to check stock
    if (this.productDetailDTO?.isVariable) {
      if (!this.selectedVariant) return false; // no variant selected -> keep existing attribute-based disabling
      return this.isVariantOutOfStock(this.selectedVariant);
    }
    // Non-variable product: check product level stock
    if (this.product) {
      if (this.product.stockStatus === 'In Stock') return false;
      if (this.product.stockStatus === 'Out of Stock') return true;
      return (
        (this.product.stockUnits === 0 || this.product.stockUnits === undefined) &&
        (this.product.stockQuantity === 0 || this.product.stockQuantity === undefined)
      );
    }
    return false;
  }

  /**
   * Find matching variant based on selected attributes and update only the main image
   * Keep thumbnail images (related_images) unchanged - same as shop-details page
   */
  private updateVariantImages() {
    // Wait for productDetailDTO to be available
    if (!this.productDetailDTO) {
      // Try to get it from cache
      this.productDetailDTO = this.productService.getCurrentProductDetailDTO();
    }

    if (
      !this.productDetailDTO ||
      !this.variants ||
      this.variants.length === 0
    ) {
      return;
    }

    // Filter out empty selections - include both numeric (API) and string (fallback) attribute IDs
    const activeSelections: Array<[number | string, string]> = Object.entries(
      this.selectedAttributes,
    ).filter(([_, value]) => value && value.trim() !== '');

    // Need to have at least one selection to find a variant
    if (activeSelections.length === 0) {
      // Reset to original main image if no selection
      // Keep related_images unchanged
      if (this.originalRelatedImages.length > 0) {
        this.productService.activeImg = this.product.img =
          this.originalRelatedImages[0];
      }
      return;
    }

    // Find variant that matches ALL selected attributes
    // First try to match with numeric attribute IDs (from API)
    const numericSelections = activeSelections
      .filter(([id, _]) => !isNaN(Number(id)))
      .map(([id, value]) => [Number(id), value as string]) as Array<
        [number, string]
      >;

    let matchingVariant: VariantDTO | undefined = undefined;

    if (numericSelections.length > 0) {
      // Match using numeric attribute IDs (API attributes)
      matchingVariant = this.variants.find((variant) => {
        if (!variant.attributes || variant.attributes.length === 0)
          return false;

        // Create a map of variant attributes
        const variantAttributeMap = new Map<number, string>(
          variant.attributes.map((attr) => [
            attr.attributeId,
            attr.attributeValue,
          ]),
        );

        // Check if ALL selected attributes match the variant
        return numericSelections.every(([attrId, selectedValue]) => {
          const variantValue = variantAttributeMap.get(attrId);
          return variantValue === selectedValue;
        });
      });
    }

    if (matchingVariant) {
      // Update only the main image with variant images (if available)
      // Keep related_images (thumbnails) unchanged - same as shop-details page
      if (matchingVariant.images && matchingVariant.images.length > 0) {
        const variantImageUrls = matchingVariant.images
          .map((img) => img.imageUrl)
          .filter((url) => url);
        if (variantImageUrls.length > 0) {
          // Only update the main image, not the thumbnails
          this.product.img = variantImageUrls[0];
          this.productService.activeImg = variantImageUrls[0];
          // Keep product.related_images as original - don't change thumbnails
        }
      }
    } else {
      // If no matching variant found, reset to original main image
      // Keep related_images unchanged
      if (this.originalRelatedImages.length > 0) {
        this.product.img = this.originalRelatedImages[0];
        this.productService.activeImg = this.originalRelatedImages[0];
      }
    }
  }

  /**
   * Get attribute values for a specific attribute
   */
  getAttributeValues(attribute: ProductAttributeDTO): string[] {
    return attribute.attributeValues || [];
  }

  /**
   * Check if a specific attribute value is out of stock, 
   * considering other currently selected attributes.
   */
  public isAttributeValueOutOfStock(attributeId: number | string, value: string): boolean {
    if (!this.productDetailDTO || !this.variants || this.variants.length === 0) {
      return false;
    }

    // If it's a fallback attribute (non-numeric key), we can't easily check variant stock 
    // unless the variants specifically use these string keys, which they don't seem to.
    const numAttrId = Number(attributeId);
    if (isNaN(numAttrId)) {
      return false;
    }

    // Identify other selected attributes (exclude the one we're checking)
    // Only consider numeric IDs for variant matching
    const otherSelections: Array<[number, string]> = Object.entries(this.selectedAttributes)
      .filter(([id, val]) => {
        const nId = Number(id);
        return !isNaN(nId) && nId !== numAttrId && val && val.trim() !== '';
      })
      .map(([id, val]) => [Number(id), val as string]);

    // Find all variants that match the other selections AND this specific value
    const matchingVariants = this.variants.filter((variant) => {
      if (!variant.attributes || variant.attributes.length === 0) return false;

      const variantAttributeMap = new Map<number, string>(
        variant.attributes.map((attr) => [attr.attributeId, attr.attributeValue])
      );

      // Must match the value being checked
      const targetValue = variantAttributeMap.get(numAttrId);
      if (targetValue !== value) return false;

      // Must match ALL other selections
      return otherSelections.every(([otherId, otherVal]) => {
        return variantAttributeMap.get(otherId) === otherVal;
      });
    });

    // If no variants match even the combinations, it's effectively "out of stock/unavailable"
    if (matchingVariants.length === 0) return true;

    // It's out of stock only if ALL matching variants for this combination are out of stock
    return matchingVariants.every(v => this.isVariantOutOfStock(v));
  }

  /**
   * Get selected value for an attribute
   * Supports both numeric attributeId (from API) and string keys (for fallback)
   */
  getSelectedValue(attributeId: number | string): string {
    return this.selectedAttributes[attributeId] || '';
  }

  /**
   * Find matching variant based on selected attributes
   * Returns the variant object if a match is found, null otherwise
   */
  private findMatchingVariant(): VariantDTO | null {
    if (
      !this.productDetailDTO ||
      !this.variants ||
      this.variants.length === 0
    ) {
      return null;
    }

    // Filter out empty selections - only include numeric attribute IDs (from API)
    const activeSelections: Array<[number, string]> = Object.entries(
      this.selectedAttributes,
    )
      .filter(([id, value]) => {
        // Only include numeric keys (API attributes), exclude string keys like 'size', 'color'
        const numId = Number(id);
        return !isNaN(numId) && value && value.trim() !== '';
      })
      .map(([id, value]) => [Number(id), value as string]);

    if (activeSelections.length === 0) {
      return null;
    }

    // Find variant that matches ALL selected attributes
    const matchingVariant = this.variants.find((variant) => {
      if (!variant.attributes || variant.attributes.length === 0) return false;

      // Create a map of variant attributes
      const variantAttributeMap = new Map<number, string>(
        variant.attributes.map((attr) => [
          attr.attributeId,
          attr.attributeValue,
        ]),
      );

      // Check if ALL selected attributes match the variant
      return activeSelections.every(([attrId, selectedValue]) => {
        const variantValue = variantAttributeMap.get(attrId);
        return variantValue === selectedValue;
      });
    });

    return matchingVariant || null;
  }

  /**
   * Check if Buy Now button should be disabled (read-only)
   */
  public isBuyNowDisabled(): boolean {
    // Disable if attributes are required but not all selected
    if (this.hasAttributes() && !this.areAllAttributesSelected()) {
      return true;
    }
    // Disable if out of stock
    return this.isOutOfStockForActions();
  }

  /**
   * Check if product has attributes that need to be selected
   * Includes both API attributes and fallback sizes/colors
   */
  hasAttributes(): boolean {
    const hasApiAttributes =
      this.availableAttributes && this.availableAttributes.length > 0;
    const hasFallbackAttributes =
      (this.product?.sizes && this.product.sizes.length > 0) ||
      (this.product?.colors && this.product.colors.length > 0);
    return hasApiAttributes || hasFallbackAttributes;
  }

  /**
   * Check if all required attributes are selected
   */
  areAllAttributesSelected(): boolean {
    if (!this.hasAttributes()) {
      return true; // No attributes means no selection needed
    }

    // Check API attributes first
    if (this.availableAttributes && this.availableAttributes.length > 0) {
      const allApiAttributesSelected = this.availableAttributes.every(
        (attr) => {
          return (
            this.selectedAttributes[attr.attributeId] &&
            this.selectedAttributes[attr.attributeId].trim() !== ''
          );
        },
      );
      if (!allApiAttributesSelected) {
        return false;
      }
    }

    // Check fallback attributes (sizes/colors) if no API attributes
    if (
      (!this.availableAttributes || this.availableAttributes.length === 0) &&
      this.product
    ) {
      if (this.product.sizes && this.product.sizes.length > 0) {
        const sizeSelected =
          this.selectedAttributes['size'] &&
          this.selectedAttributes['size'].trim() !== '';
        if (!sizeSelected) {
          return false;
        }
      }
      if (this.product.colors && this.product.colors.length > 0) {
        const colorSelected =
          this.selectedAttributes['color'] &&
          this.selectedAttributes['color'].trim() !== '';
        if (!colorSelected) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get list of missing attribute names
   */
  getMissingAttributes(): string[] {
    if (!this.hasAttributes()) {
      return [];
    }

    const missing: string[] = [];

    // Check API attributes
    if (this.availableAttributes && this.availableAttributes.length > 0) {
      this.availableAttributes.forEach((attr) => {
        const selectedValue = this.selectedAttributes[attr.attributeId];
        if (!selectedValue || selectedValue.trim() === '') {
          missing.push(attr.attributeName || `Attribute ${attr.attributeId}`);
        }
      });
    }

    // Check fallback attributes if no API attributes
    if (
      (!this.availableAttributes || this.availableAttributes.length === 0) &&
      this.product
    ) {
      if (this.product.sizes && this.product.sizes.length > 0) {
        const sizeSelected =
          this.selectedAttributes['size'] &&
          this.selectedAttributes['size'].trim() !== '';
        if (!sizeSelected) {
          missing.push('Size');
        }
      }
      if (this.product.colors && this.product.colors.length > 0) {
        const colorSelected =
          this.selectedAttributes['color'] &&
          this.selectedAttributes['color'].trim() !== '';
        if (!colorSelected) {
          missing.push('Color');
        }
      }
    }

    return missing;
  }

  /**
   * Add product to cart with variant selection
   */
  addToCartFromModal(): void {
    // If product has attributes (regardless of isVariable), require all attributes to be selected
    if (this.hasAttributes()) {
      if (!this.areAllAttributesSelected()) {
        const missingAttrs = this.getMissingAttributes();
        const missingList =
          missingAttrs.length > 0
            ? missingAttrs.join(', ')
            : 'all required attributes';
        this.toastrService.error(
          `Please select ${missingList} before adding to cart`,
        );
        return;
      }
    }

    // Find matching variant if product is variable and has attributes
    let variantId: number | undefined = undefined;
    let variantSku: string | undefined = undefined;
    let variantPrice: number | undefined = undefined;
    let selectedAttrs: { [key: number | string]: string } | undefined =
      undefined;
    let attributeNames: { [key: number | string]: string } | undefined =
      undefined;

    if (this.productDetailDTO?.isVariable && this.hasAttributes()) {
      const matchingVariant = this.findMatchingVariant();

      if (!matchingVariant) {
        this.toastrService.error('Please select valid variant attributes');
        return;
      }

      // Prevent adding to cart if selected variant is out of stock
      if (
        (matchingVariant.stockUnits === 0 || matchingVariant.stockUnits === undefined) &&
        (matchingVariant.stockQuantity === 0 || matchingVariant.stockQuantity === undefined)
      ) {
        this.toastrService.error('Selected variant is out of stock');
        return;
      }

      variantId = matchingVariant.variantId;
      variantSku = matchingVariant.sku;
      variantPrice = matchingVariant.price; // Use variant price

      // Store selected attributes - convert to object with attribute IDs as keys
      selectedAttrs = {};
      attributeNames = {};
      Object.entries(this.selectedAttributes).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          selectedAttrs![key] = value;
          // Find attribute name from availableAttributes
          const attribute = this.availableAttributes.find(
            (attr) => attr.attributeId.toString() === key.toString(),
          );
          if (attribute && attribute.attributeName) {
            attributeNames![key] = attribute.attributeName;
          }
        }
      });
    } else if (this.hasAttributes()) {
      // For non-variable products with attributes, still store selected attributes
      selectedAttrs = {};
      attributeNames = {};
      Object.entries(this.selectedAttributes).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          selectedAttrs![key] = value;
          // Find attribute name from availableAttributes
          const attribute = this.availableAttributes.find(
            (attr) => attr.attributeId.toString() === key.toString(),
          );
          if (attribute && attribute.attributeName) {
            attributeNames![key] = attribute.attributeName;
          }
        }
      });
    }

    // Calculate unit price: variant price - (variant price * discount / 100)
    // Get discount from product (header level)
    const productDiscount = this.product.discount || 0;
    let calculatedPriceAfterDiscount: number;

    if (variantPrice !== undefined) {
      // Calculate: variant price - (variant price * discount / 100)
      calculatedPriceAfterDiscount =
        variantPrice - (variantPrice * productDiscount) / 100;
    } else {
      // For non-variable products, use existing priceAfterDiscount or calculate from price
      calculatedPriceAfterDiscount =
        this.product.priceAfterDiscount !== undefined
          ? this.product.priceAfterDiscount
          : this.product.discount && this.product.discount > 0
            ? this.product.price -
            (this.product.price * this.product.discount) / 100
            : this.product.price;
    }

    // Create a copy of the product with variant information
    const productToAdd: IProduct = {
      ...this.product,
      variantId: variantId,
      sku: variantSku || this.product.sku,
      selectedAttributes: selectedAttrs,
      attributeNames: attributeNames,
      // Use variant price as base price if available, otherwise keep product price
      price: variantPrice !== undefined ? variantPrice : this.product.price,
      // Calculate priceAfterDiscount: variant price - (variant price * discount / 100)
      priceAfterDiscount: calculatedPriceAfterDiscount,
    };

    // Add to cart with variant information
    this.cartService.addCartProduct(productToAdd, variantId);

    // Also update wishlist item if it exists (update with variant details)
    const wishlistItems = this.wishlistService.getWishlistProducts();
    const wishlistItem = wishlistItems.find(
      (item: IProduct) => item.id === productToAdd.id,
    );
    if (wishlistItem) {
      // Update the wishlist item with variant details
      const updatedWishlistItem: IProduct = {
        ...wishlistItem,
        variantId: variantId,
        sku: variantSku || productToAdd.sku,
        selectedAttributes: selectedAttrs,
        attributeNames: attributeNames,
        price: variantPrice !== undefined ? variantPrice : wishlistItem.price,
        priceAfterDiscount: calculatedPriceAfterDiscount,
      };
      // Update the existing wishlist item
      this.wishlistService.updateWishlistItem(
        productToAdd.id,
        updatedWishlistItem,
      );
    }
  }

  /**
   * Add product to wishlist from modal with variant selection
   */
  addToWishlistFromModal(): void {
    // Check attributes validation (same as cart)
    if (this.hasAttributes()) {
      if (!this.areAllAttributesSelected()) {
        const missingAttrs = this.getMissingAttributes();
        const missingList =
          missingAttrs.length > 0
            ? missingAttrs.join(', ')
            : 'all required attributes';
        this.toastrService.error(
          `Please select ${missingList} before adding to wishlist`,
        );
        return;
      }
    }

    // Find matching variant if product is variable and has attributes
    let variantId: number | undefined = undefined;
    let variantSku: string | undefined = undefined;
    let variantPrice: number | undefined = undefined;
    let selectedAttrs: { [key: number | string]: string } | undefined =
      undefined;
    let attributeNames: { [key: number | string]: string } | undefined =
      undefined;

    if (this.productDetailDTO?.isVariable && this.hasAttributes()) {
      const matchingVariant = this.findMatchingVariant();

      if (!matchingVariant) {
        this.toastrService.error('Please select valid variant attributes');
        return;
      }

      variantId = matchingVariant.variantId;
      variantSku = matchingVariant.sku;
      variantPrice = matchingVariant.price;

      selectedAttrs = {};
      attributeNames = {};
      Object.entries(this.selectedAttributes).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          selectedAttrs![key] = value;
          const attribute = this.availableAttributes.find(
            (attr) => attr.attributeId.toString() === key.toString(),
          );
          if (attribute && attribute.attributeName) {
            attributeNames![key] = attribute.attributeName;
          }
        }
      });
    } else if (this.hasAttributes()) {
      selectedAttrs = {};
      attributeNames = {};
      Object.entries(this.selectedAttributes).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          selectedAttrs![key] = value;
          const attribute = this.availableAttributes.find(
            (attr) => attr.attributeId.toString() === key.toString(),
          );
          if (attribute && attribute.attributeName) {
            attributeNames![key] = attribute.attributeName;
          }
        }
      });
    }

    // Calculate price logic (same as cart)
    const productDiscount = this.product.discount || 0;
    let calculatedPriceAfterDiscount: number;

    if (variantPrice !== undefined) {
      calculatedPriceAfterDiscount =
        variantPrice - (variantPrice * productDiscount) / 100;
    } else {
      calculatedPriceAfterDiscount =
        this.product.priceAfterDiscount !== undefined
          ? this.product.priceAfterDiscount
          : this.product.discount && this.product.discount > 0
            ? this.product.price -
            (this.product.price * this.product.discount) / 100
            : this.product.price;
    }

    // Create product object for wishlist
    const productToWishlist: IProduct = {
      ...this.product,
      variantId: variantId,
      sku: variantSku || this.product.sku,
      selectedAttributes: selectedAttrs,
      attributeNames: attributeNames,
      price: variantPrice !== undefined ? variantPrice : this.product.price,
      priceAfterDiscount: calculatedPriceAfterDiscount,
    };

    // Add to wishlist
    this.wishlistService.add_wishlist_product(productToWishlist, variantId);
  }
}
