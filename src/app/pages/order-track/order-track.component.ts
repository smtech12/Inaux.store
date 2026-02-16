import { Component, OnInit } from '@angular/core';
import { OrderTrackResponse, OrderSaleInfo, OrderDetailDTO } from '../../shared/types/order-history-model';
import { ProductService } from '../../shared/services/product.service';

@Component({
  selector: 'app-order-track',
  templateUrl: './order-track.component.html',
  styleUrls: ['./order-track.component.scss']
})
export class OrderTrackComponent implements OnInit {
  orderNumber: string = '';
  orderData: OrderTrackResponse | null = null;
  loading: boolean = false;
  error: string = '';

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * Track order by transaction number
   */
  trackOrder(): void {
    if (!this.orderNumber.trim()) {
      this.error = 'Please enter an order number';
      return;
    }

    this.loading = true;
    this.error = '';
    this.orderData = null;

    this.productService.trackOrder(this.orderNumber.trim()).subscribe({
      next: (response) => {
        this.loading = false;
        if (response && response.successData) {
          this.orderData = response.successData;
        } else {
          this.error = response?.message || 'Order not found';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || error?.message || 'Failed to track order. Please try again.';
        console.error('Order tracking error:', error);
      }
    });
  }

  /**
   * Handle Enter key press in input
   */
  onEnterKey(event: any): void {
    if (event.key === 'Enter') {
      this.trackOrder();
    }
  }

  /**
   * Clear the form
   */
  clearForm(): void {
    this.orderNumber = '';
    this.orderData = null;
    this.error = '';
  }

  /**
   * Get status color for display
   */
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '#28a745';
      case 'shipped':
        return '#007bff';
      case 'processing':
        return '#ffc107';
      case 'pending':
      case 'pending allocation':
        return '#6c757d';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }

  /**
   * Get formatted date
   */
  getFormattedDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get product image URL from API response or fallback to default
   */
  getProductImage(item: OrderDetailDTO): string {
    if (item.imageUrl) {
      return item.imageUrl;
    }
    return 'assets/img/product/default.jpg';
  }

  /**
   * Get tracking timeline based on order status
   */
  getTrackingTimeline(): { status: string; date: string; completed: boolean }[] {
    if (!this.orderData) return [];

    // Map the actual sale status to tracking timeline
    const timeline = [
      { status: this.orderData.sale.status, date: this.orderData.sale.createdDate, completed: true }
    ];

    return timeline;
  }
}
