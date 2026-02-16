import { Component, OnInit } from '@angular/core';
import { AuthService, FeedbackDTO } from '../../shared/services/auth.service';
import { LoaderService } from '../../shared/services/loader.service';
import { OrderHistoryDTO } from '../../shared/types/order-history-model';
import { CustomerContactInfoDTO } from '../../shared/types/customer-info-model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  public orderHistory: OrderHistoryDTO[] = [];
  public isLoading: boolean = false;
  public isLoadingCustomerInfo: boolean = false;
  public customerName: string = 'Guest';
  public customerInfo: CustomerContactInfoDTO | null = null;

  // Feedback/Review properties
  public currentReviewOrder: OrderHistoryDTO | null = null;
  public reviews: FeedbackDTO[] = [];
  public isSubmittingFeedback: boolean = false;

  constructor(
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.loadCustomerName();
    this.loadCustomerContactInfo();
    this.loadOrderHistory();
  }

  /**
   * Load customer name from token
   */
  private loadCustomerName() {
    const name = this.authService.getName();
    if (name) {
      this.customerName = name;
    }
  }

  /**
   * Load customer contact information from API 
   */
  private loadCustomerContactInfo() {
    const customerIdStr = this.authService.getCustomerId();
    if (!customerIdStr) {
      return;
    }

    const customerId = parseInt(customerIdStr, 10);
    if (isNaN(customerId)) {
      console.error('Invalid customer ID:', customerIdStr);
      return;
    }

    this.isLoadingCustomerInfo = true;

    this.authService.getCustomerContactInfo(customerId).subscribe({
      next: (response) => {
        this.isLoadingCustomerInfo = false;

        if (response && response.successData) {
          this.customerInfo = response.successData;
          // Update customer name from API if available
          if (response.successData.customerName) {
            this.customerName = response.successData.customerName;
          }
        }
      },
      error: (error) => {
        this.isLoadingCustomerInfo = false;
        console.error('Error loading customer info:', error);
        // Don't show error toast as this is not critical
      }
    });
  }

  /**
   * Load customer order history from API
   */
  private loadOrderHistory() {
    const customerIdStr = this.authService.getCustomerId();
    if (!customerIdStr) {
      this.toastr.warning('Please login to view order history');
      return;
    }

    const customerId = parseInt(customerIdStr, 10);
    if (isNaN(customerId)) {
      console.error('Invalid customer ID:', customerIdStr);
      return;
    }

    this.isLoading = true;
    this.loaderService.show();

    this.authService.getCustomerOrderHistory(customerId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loaderService.hide();

        if (response && response.successData) {
          if (Array.isArray(response.successData)) {
            this.orderHistory = response.successData;
          } else if (typeof response.successData === 'string') {
            // No orders found
            this.orderHistory = [];
            this.toastr.info(response.successData);
          } else {
            this.orderHistory = [];
          }
        } else {
          this.orderHistory = [];
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.loaderService.hide();
        console.error('Error loading order history:', error);
        this.toastr.error('Failed to load order history');
        this.orderHistory = [];
      }
    });
  }

  /**
   * Format date string
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get first product image or default
   */
  getProductImage(detail: OrderHistoryDTO['details'][0]): string {
    // Check if images array exists and has items
    if (detail.images && detail.images.length > 0) {
      return detail.images[0];
    }
    return '/assets/img/product/product-1.jpg';
  }

  /**
   * Initialize and open the review modal for an order
   */
  openReviewModal(order: OrderHistoryDTO) {
    this.currentReviewOrder = order;

    // Initialize reviews array with empty feedbacks for each item in the order
    const customerId = parseInt(this.authService.getCustomerId() || '0', 10);
    this.reviews = order.details.map(item => ({
      CustomerId: customerId,
      SKU: item.sku,
      Remarks: '',
      Rating: 0,
      SaleId: order.saleid
    }));
  }

  /**
   * Close review modal and reset state
   */
  closeReviewModal() {
    this.currentReviewOrder = null;
    this.reviews = [];
    this.isSubmittingFeedback = false;
  }

  /**
   * Set rating for a specific product in the order
   */
  setRating(index: number, rating: number) {
    if (this.reviews[index]) {
      this.reviews[index].Rating = rating;
    }
  }

  /**
   * Check if all items have a rating
   */
  isFeedbackValid(): boolean {
    return this.reviews.length > 0 && this.reviews.every(r => r.Rating > 0);
  }

  /**
   * Submit feedback for all products in the order
   */
  submitFeedback() {
    if (!this.isFeedbackValid()) {
      this.toastr.warning('Please provide a rating for all items');
      return;
    }

    this.isSubmittingFeedback = true;
    this.loaderService.show();

    // The API expects a list of FeedbackDTO
    this.authService.createFeedback(this.reviews).subscribe({
      next: (response) => {
        this.isSubmittingFeedback = false;
        this.loaderService.hide();

        if (response && response.statusCode === 201) {
          this.toastr.success('Thank you for your feedback!');

          // Update local state to hide the review button immediately
          if (this.currentReviewOrder) {
            this.currentReviewOrder.isFeedbackGiven = 1;
          }

          this.closeReviewModal();
          // Ideally, we'd close the modal via Bootstrap API here too
          // but since we're using data attributes, we rely on the manual close or state change
          // For a better UX, we might need to trigger the close button programmably
          const closeBtn = document.querySelector('#orderReviewModal .btn-close') as HTMLElement;
          if (closeBtn) closeBtn.click();
        } else {
          this.toastr.error(response.errorData || 'Failed to submit feedback');
        }
      },
      error: (error) => {
        this.isSubmittingFeedback = false;
        this.loaderService.hide();
        console.error('Error submitting feedback:', error);
        this.toastr.error('An error occurred while submitting feedback');
      }
    });
  }
}
