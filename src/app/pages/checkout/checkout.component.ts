import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { CartService } from 'src/app/shared/services/cart.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IProduct } from 'src/app/shared/types/product-d-t';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  public isOpenLogin = false;
  public isOpenCoupon = false;
  public couponCode: string = '';
  public checkoutForm!: FormGroup;
  public formSubmitted = false;
  public isLoading: boolean = false;
  private transactionCounter: number = 1;
  public isAuthenticated: boolean = false;
  public createdAccountInfo: { username: string; phone: string; password?: string; transactionNumber?: string } | null = null;
  public showAccountModal: boolean = false;

  // Coupon related properties
  public couponApplied: boolean = false;
  public isApplyingCoupon: boolean = false;
  public couponMessage: string = '';
  public couponDiscount: number = 0;
  public appliedCouponCode: string = '';

  // Delivery charge
  public deliveryCharge: number = 149;

  constructor(
    public cartService: CartService,
    private toastrService: ToastrService,
    private authService: AuthService,
    private router: Router,
  ) { }

  closeAccountModal() {
    this.showAccountModal = false;
    this.createdAccountInfo = null;
    this.router.navigate(['/home']);
  }

  handleOpenLogin() {
    this.isOpenLogin = !this.isOpenLogin;
  }
  handleOpenCoupon() {
    this.isOpenCoupon = !this.isOpenCoupon;
  }

  handleCouponSubmit() {
    if (this.couponCode) {
      this.couponCode = '';
    }
  }

  ngOnInit() {
    // Check initial auth status
    this.checkAuthStatus();

    // Subscribe to token changes to update status dynamically
    this.authService.getToken$().subscribe((token) => {
      this.checkAuthStatus();
    });

    this.checkoutForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      email: new FormControl(null),
      address: new FormControl(null, Validators.required),
      phoneNumber: new FormControl(null, Validators.required),
      secPhoneNumber: new FormControl(null),
    });

    // Fetch and populate customer info
    this.fetchCustomerInfo();
  }

  checkAuthStatus() {
    this.isAuthenticated = this.authService.hasToken();
  }

  /**
   * Fetch customer information and populate the checkout form
   */
  fetchCustomerInfo() {
    // Try to get basic info from token first
    const name = this.authService.getName();
    const claims = this.authService.getTokenClaims();
    const email = claims ? (claims.email || claims.Email) : '';

    if (name || email) {
      this.checkoutForm.patchValue({
        name: name || '',
        email: email || ''
      });
    }

    const customerIdStr = this.authService.getCustomerId();
    if (!customerIdStr) {
      // Guest or no ID, we are done
      return;
    }

    const customerId = parseInt(customerIdStr, 10);
    if (isNaN(customerId)) {
      console.error('Invalid customer ID');
      return;
    }

    this.authService.getCustomerContactInfo(customerId).subscribe({
      next: (response) => {
        if (response.statusCode === 200 && response.successData) {
          const customerData = response.successData;

          // Populate form with customer data
          this.checkoutForm.patchValue({
            name: customerData.customerName || this.checkoutForm.get('name')?.value || '',
            email: customerData.email || this.checkoutForm.get('email')?.value || '',
            address: customerData.address || '',
            phoneNumber: customerData.phoneNumber || '',
            secPhoneNumber: customerData.secondaryPhoneNumber || '',
          });

          console.log('Customer info loaded successfully:', customerData);
        } else {
          console.warn('Customer info not found:', response.errorData);
          // Form remains empty for user to fill manually
        }
      },
      error: (error) => {
        console.error('Error fetching customer info:', error);
        // Form remains empty for user to fill manually
        this.toastrService.warning('Could not load your saved information. Please fill in the form manually.');
      }
    });
  }

  /**
   * Generate transaction number in format: year+month+date+0001, 0002, etc.
   */
  private generateTransactionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}${month}${date}${hours}${minutes}${seconds}${milliseconds}`;
  }

  onSubmit() {
    this.formSubmitted = true;

    if (!this.checkoutForm.valid) {
      this.toastrService.error('Please fill in all required fields');
      return;
    }

    // Get CustomerId from auth
    const customerIdStr = this.authService.getCustomerId();
    let customerId = 0;

    if (customerIdStr) {
      customerId = parseInt(customerIdStr, 10);
      if (isNaN(customerId)) {
        this.toastrService.error('Invalid customer ID');
        return;
      }
    } else {
      // Guest user (either with token but no CustomerId, OR no token at all)
      customerId = 0;
    }

    // Check if cart is empty
    const cartItems = this.cartService.getCartProducts();
    if (!cartItems || cartItems.length === 0) {
      this.toastrService.error('Cart is empty');
      return;
    }

    this.isLoading = true;

    // Prepare cart items for API
    const cartItemsRequest = cartItems.map((item) => {
      // Get discount percentage
      const discountPercentage = item.discount || 0;

      // Price should be the original unit price (before discount)
      // This is the variant price or product price without discount applied
      const unitPrice = item.price;

      // VariantId is required by API - use variantId if available, otherwise use 0
      // Note: For non-variable products, variantId might be undefined
      const variantId = item.variantId !== undefined ? item.variantId : 0;

      return {
        ProductId: item.id || null,
        VariantId: variantId,
        Price: unitPrice, // Original unit price before discount
        DiscountPercentage: discountPercentage,
        Quantity: item.orderQuantity || 1,
      };
    });

    // Generate transaction number
    const transactionNumber = this.generateTransactionNumber();

    // Prepare order request
    const orderRequest = {
      CustomerId: customerId !== 0 ? customerId : 0, // Backend requires int, so sending 0 for guest
      Name: this.checkoutForm.value.name,
      Email: this.checkoutForm.value.email,
      Address: this.checkoutForm.value.address || null,
      PhoneNumber: this.checkoutForm.value.phoneNumber || null,
      SecPhoneNumber: this.checkoutForm.value.secPhoneNumber || null,
      TransactionNumber: transactionNumber,
      PaymentMethod: 'COD',
      Type: 'Delivery',
      CartItems: cartItemsRequest,
    };

    // Call API
    this.authService.createCustomerOrder(orderRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.statusCode === 200) {
          this.toastrService.success('Thank You! Your order has been placed successfully.');
          // Check if we have generated account info for a guest
          let showModal = false;
          if (customerId === 0 && response.successData) {
            const data = response.successData;
            const customerData = data.customer || {};

            const email = customerData.email;
            const phone = customerData.phone;
            const name = customerData.customerName;

            // Only show modal if we have some data
            if (phone) {
              this.createdAccountInfo = {
                username: email || name, // User requested Email as username
                phone: phone,
                password: phone, // User requested Phone as password
                transactionNumber: transactionNumber // Add transaction number
              };
              this.showAccountModal = true;
              showModal = true;
            }
          }

          // Clear cart without confirmation
          this.cartService.clear_cart(false);
          // Reset form
          this.checkoutForm.reset();
          this.formSubmitted = false;

          // Navigate only if not showing modal
          if (!showModal) {
            this.router.navigate(['/home']);
          }
        } else {
          this.toastrService.error(
            response.errorData || response.message || 'Failed to place order',
          );
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error placing order:', error);
        this.toastrService.error(
          error.error?.errorData ||
          error.error?.message ||
          'Failed to place order. Please try again.',
        );
      },
    });
  }

  get address() {
    return this.checkoutForm.get('address');
  }
  get phoneNumber() {
    return this.checkoutForm.get('phoneNumber');
  }
  get secPhoneNumber() {
    return this.checkoutForm.get('secPhoneNumber');
  }

  /**
   * Check if item has selected attributes
   */
  hasAttributes(item: IProduct): boolean {
    return !!(
      item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0
    );
  }

  /**
   * Get attribute entries with names and values for display
   * Returns array of { name: string, value: string } objects
   */
  getAttributeEntries(item: IProduct): Array<{ name: string; value: string }> {
    if (
      !item.selectedAttributes ||
      Object.keys(item.selectedAttributes).length === 0
    ) {
      return [];
    }

    const entries: Array<{ name: string; value: string }> = [];

    Object.entries(item.selectedAttributes).forEach(([key, value]) => {
      // Get attribute name from attributeNames map, or use a fallback
      const attributeName =
        item.attributeNames?.[key] || this.getFallbackAttributeName(key);
      entries.push({
        name: attributeName,
        value: value,
      });
    });

    return entries;
  }

  /**
   * Fallback method to get attribute name if not stored
   * This handles cases where attribute names might not be available
   */
  private getFallbackAttributeName(attributeId: string | number): string {
    // Common attribute names - you can extend this based on your API
    const commonNames: { [key: string]: string } = {
      '2': 'Color',
      '3': 'Size',
      color: 'Color',
      size: 'Size',
      Color: 'Color',
      Size: 'Size',
    };

    return commonNames[attributeId.toString()] || `Attribute ${attributeId}`;
  }

  /**
   * Get the price to display for an item (priceAfterDiscount if available, otherwise calculated from price and discount)
   */
  getItemPrice(item: IProduct): number {
    if (item.priceAfterDiscount !== undefined && item.priceAfterDiscount > 0) {
      return item.priceAfterDiscount;
    } else if (item.discount && item.discount > 0) {
      return item.price - (item.price * item.discount) / 100;
    } else {
      return item.price;
    }
  }

  /**
   * Apply coupon code
   */
  applyCoupon() {
    if (!this.couponCode || this.couponCode.trim() === '') {
      this.couponMessage = 'Please enter a coupon code';
      return;
    }

    this.isApplyingCoupon = true;
    this.couponMessage = '';

    // Simulate coupon validation (in real app, this would call an API)
    setTimeout(() => {
      const upperCoupon = this.couponCode.toUpperCase().trim();

      // Mock coupon validation - you can replace this with actual API call
      if (upperCoupon === 'SAVE10' || upperCoupon === 'WELCOME10') {
        this.couponDiscount = 10; // 10% discount
        this.couponApplied = true;
        this.appliedCouponCode = upperCoupon;
        this.couponMessage = `Coupon applied! You got ${this.couponDiscount}% discount`;
        this.toastrService.success('Coupon applied successfully!');
      } else if (upperCoupon === 'SAVE20' || upperCoupon === 'SPECIAL20') {
        this.couponDiscount = 20; // 20% discount
        this.couponApplied = true;
        this.appliedCouponCode = upperCoupon;
        this.couponMessage = `Coupon applied! You got ${this.couponDiscount}% discount`;
        this.toastrService.success('Coupon applied successfully!');
      } else if (upperCoupon === 'FLAT50') {
        // Flat 50 rupees off
        const cartTotal = this.cartService.totalPriceQuantity().total;
        if (cartTotal >= 200) {
          this.couponDiscount = 50; // Fixed amount
          this.couponApplied = true;
          this.appliedCouponCode = upperCoupon;
          this.couponMessage = `Coupon applied! You got Rs ${this.couponDiscount} discount`;
          this.toastrService.success('Coupon applied successfully!');
        } else {
          this.couponMessage = 'This coupon requires minimum order of Rs 200';
          this.toastrService.error('This coupon requires minimum order of Rs 200');
        }
      } else {
        this.couponMessage = 'Invalid coupon code';
        this.toastrService.error('Invalid coupon code');
      }

      this.isApplyingCoupon = false;
    }, 1000);
  }

  /**
   * Remove applied coupon
   */
  removeCoupon() {
    this.couponApplied = false;
    this.couponDiscount = 0;
    this.appliedCouponCode = '';
    this.couponCode = '';
    this.couponMessage = 'Coupon removed';
    this.toastrService.info('Coupon removed');
  }

  /**
   * Calculate total with coupon discount and delivery charges
   */
  getTotalWithCoupon(): number {
    const cartTotal = this.cartService.totalPriceQuantity().total;

    if (this.appliedCouponCode === 'FLAT50') {
      return Math.max(0, cartTotal - this.couponDiscount + this.deliveryCharge);
    } else {
      return (cartTotal * (1 - this.couponDiscount / 100)) + this.deliveryCharge;
    }
  }

  /**
   * Get coupon discount amount
   */
  getCouponDiscountAmount(): number {
    const cartTotal = this.cartService.totalPriceQuantity().total;

    if (this.appliedCouponCode === 'FLAT50') {
      return this.couponDiscount;
    } else {
      return cartTotal * (this.couponDiscount / 100);
    }
  }

  /**
   * Get final order total including delivery charges
   */
  getFinalOrderTotal(): number {
    if (this.couponApplied) {
      return this.getTotalWithCoupon();
    } else {
      return this.cartService.totalPriceQuantity().total + this.deliveryCharge;
    }
  }
}
