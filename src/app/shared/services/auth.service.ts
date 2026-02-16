import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponseMessage } from '../types/product-list-model';
import { OrderHistoryDTO } from '../types/order-history-model';
import { CustomerContactInfoDTO } from '../types/customer-info-model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.API_BASE_URL + '/WebFront';
  private readonly TOKEN_STORAGE_KEY = 'guest_token';
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());

  constructor(private http: HttpClient) {
    // Load token from localStorage on service initialization
    // Priority: customer token > guest token
    const existingToken = this.getTokenFromStorage();
    if (existingToken) {
      this.tokenSubject.next(existingToken);
    }
  }

  /**
   * Get current token as Observable
   */
  getToken$(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  /**
   * Get current token synchronously
   * Priority: customer token (cus_token) > guest token (guest_token)
   */
  getToken(): string | null {
    // Check for customer token first
    const customerToken = this.getCustomerToken();
    if (customerToken) {
      return customerToken;
    }
    // Fall back to token subject value (guest token)
    return this.tokenSubject.value;
  }

  /**
   * Generate guest token from API
   * @param secretKey Secret key for token generation
   * @returns Observable of token string
   */
  generateToken(secretKey: string): Observable<string | null> {
    const params = new HttpParams().set('secretKey', secretKey);

    return this.http.get<ApiResponseMessage<{ token: string }>>(`${this.baseUrl}/generate-token`, { params })
      .pipe(
        map(response => {
          if (response && response.successData && response.successData.token) {
            const token = response.successData.token;
            this.setToken(token);
            return token;
          }
          console.error('Token generation failed: No token in response', response);
          return null;
        }),
        catchError(error => {
          console.error('Error generating token:', error);
          return of(null);
        })
      );
  }

  /**
   * Set token and store in localStorage
   */
  setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
      this.tokenSubject.next(token);
    } catch (error) {
      console.error('Error storing token in localStorage:', error);
    }
  }

  /**
   * Get token from localStorage
   * Priority: customer token (cus_token) > guest token (guest_token)
   */
  private getTokenFromStorage(): string | null {
    try {
      // Check for customer token first
      const customerToken = localStorage.getItem('cus_token');
      if (customerToken) {
        return customerToken;
      }
      // Fall back to guest token
      return localStorage.getItem(this.TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove token from storage (logout)
   * Clears both guest and customer tokens
   */
  clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
      localStorage.removeItem('cus_token');
      this.tokenSubject.next(null);
    } catch (error) {
      console.error('Error clearing token from localStorage:', error);
    }
  }

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Register a new customer
   * @param request Customer registration data
   * @returns Observable of API response with token
   */
  registerCustomer(request: CustomerRegisterRequest): Observable<ApiResponseMessage<{ token?: string; Token?: string }>> {
    return this.http.post<ApiResponseMessage<{ token?: string; Token?: string }>>(
      `${this.baseUrl}/register-customer`,
      request
    );
  }

  /**
   * Login customer
   * @param request Customer login data
   * @returns Observable of API response with token and customer info
   */
  loginCustomer(request: CustomerLoginRequest): Observable<ApiResponseMessage<{ Token?: string; token?: string; Customer?: any; customer?: any }>> {
    return this.http.post<ApiResponseMessage<{ Token?: string; token?: string; Customer?: any; customer?: any }>>(
      `${this.baseUrl}/login-customer`,
      request
    );
  }

  /**
   * Clear all tokens from localStorage
   */
  clearAllTokens(): void {
    try {
      // Remove guest token
      localStorage.removeItem('guest_token');
      // Remove customer token if exists
      localStorage.removeItem('cus_token');
      // Remove any other potential token keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('token') || key.includes('Token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Reset token subject
      this.tokenSubject.next(null);
    } catch (error) {
      console.error('Error clearing tokens from localStorage:', error);
    }
  }

  /**
   * Logout and immediately generate new guest token
   * Ensures API calls continue working after logout
   * @returns Observable of the new guest token generation
   */
  logoutWithImmediateTokenGeneration(): Observable<string | null> {
    // Clear all existing tokens first
    this.clearAllTokens();

    // Immediately generate new guest token
    return this.generateToken(environment.GUEST_TOKEN_SECRET_KEY);
  }

  /**
   * Set customer token and clear all other tokens
   * @param token Customer JWT token
   */
  setCustomerToken(token: string): void {
    try {
      // Clear all existing tokens first
      this.clearAllTokens();

      // Store customer token with key 'cus_token'
      localStorage.setItem('cus_token', token);
      this.tokenSubject.next(token);
    } catch (error) {
      console.error('Error storing customer token in localStorage:', error);
    }
  }

  /**
   * Get customer token from localStorage
   */
  getCustomerToken(): string | null {
    try {
      return localStorage.getItem('cus_token');
    } catch (error) {
      console.error('Error reading customer token from localStorage:', error);
      return null;
    }
  }

  /**
   * Decode JWT token and return payload
   * @param token JWT token string
   * @returns Decoded token payload or null if invalid
   */
  private decodeToken(token: string): any | null {
    try {
      // JWT has 3 parts: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format');
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      // Replace URL-safe base64 characters
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // Decode base64
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  /**
   * Get CustomerId from JWT token
   * @returns CustomerId as string or null if not found
   */
  getCustomerId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    if (!decoded) {
      return null;
    }

    // Try both CustomerId and customerId (case variations)
    return decoded.CustomerId || decoded.customerId || decoded.CustomerID || decoded.customerID || null;
  }

  /**
   * Get Name from JWT token
   * @returns Name as string or null if not found
   */
  getName(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    if (!decoded) {
      return null;
    }

    // Try both name and Name (JWT standard uses 'name' in claims)
    return decoded.name || decoded.Name || decoded.FullName || decoded.fullName || null;
  }

  /**
   * Get UserId from JWT token
   * @returns UserId as string or null if not found
   */
  getUserId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    if (!decoded) {
      return null;
    }

    // Try both UserId and userId
    return decoded.UserId || decoded.userId || decoded.UserID || decoded.userID || null;
  }

  /**
   * Get TenantId from JWT token
   * @returns TenantId as string or null if not found
   */
  getTenantId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    if (!decoded) {
      return null;
    }

    // Try both TenantId and tenantId
    return decoded.TenantId || decoded.tenantId || decoded.TenantID || decoded.tenantID || null;
  }

  /**
   * Get all token claims as an object
   * @returns Decoded token payload or null
   */
  getTokenClaims(): any | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    return this.decodeToken(token);
  }

  /**
   * Create customer order
   * @param request Customer order data
   * @returns Observable of API response
   */
  createCustomerOrder(request: CustomerOrderRequest): Observable<ApiResponseMessage<any>> {
    return this.http.post<ApiResponseMessage<any>>(
      `${this.baseUrl}/create-customer-order`,
      request
    );
  }

  /**
   * Get customer order history
   * @param customerId Customer ID
   * @returns Observable of order history array
   */
  getCustomerOrderHistory(customerId: number): Observable<ApiResponseMessage<OrderHistoryDTO[]>> {
    const params = new HttpParams().set('customerId', customerId.toString());
    return this.http.get<ApiResponseMessage<OrderHistoryDTO[]>>(
      `${this.baseUrl}/get-customer-history`,
      { params }
    );
  }

  /**
   * Get customer contact information
   * @param customerId Customer ID
   * @returns Observable of customer contact info
   */
  getCustomerContactInfo(customerId: number): Observable<ApiResponseMessage<CustomerContactInfoDTO>> {
    const params = new HttpParams().set('customerId', customerId.toString());
    return this.http.get<ApiResponseMessage<CustomerContactInfoDTO>>(
      `${this.baseUrl}/get-customer-info`,
      { params }
    );
  }

  /**
   * Create feedback for products
   * @param requests List of feedback data
   * @returns Observable of API response
   */
  createFeedback(requests: FeedbackDTO[]): Observable<ApiResponseMessage<any>> {
    return this.http.post<ApiResponseMessage<any>>(
      `${this.baseUrl}/feedback`,
      requests
    );
  }
}

/**
 * Feedback DTO model
 */
export interface FeedbackDTO {
  CustomerId: number;
  SKU: string;
  Remarks: string;
  Rating: number;
  SaleId?: number | null;
}

/**
 * Customer registration request model
 * Matches C# CustomerRegisterRequest model
 */
export interface CustomerRegisterRequest {
  Name: string;
  Email: string;
  Password: string;
  PhoneNumber?: string | null;
  SecPhoneNumber?: string | null;
  Address?: string | null;
}

/**
 * Customer login request model
 * Matches C# CustomerLoginRequest model
 */
export interface CustomerLoginRequest {
  Email: string;
  Password: string;
}

/**
 * Customer order request model
 * Matches C# CustomerOrderDTO model
 */
export interface CustomerOrderRequest {
  CustomerId: number;
  Name?: string | null;
  Email?: string | null;
  Address?: string | null;
  PhoneNumber?: string | null;
  SecPhoneNumber?: string | null;
  TransactionNumber?: string | null;
  PaymentMethod: string;
  Type: string;
  CartItems: CustomerCartItemRequest[];
}

/**
 * Customer cart item request model
 * Matches C# CustomerCartItemDTO model
 */
export interface CustomerCartItemRequest {
  ProductId?: number | null;
  VariantId: number;
  Price: number;
  DiscountPercentage: number;
  Quantity: number;
}

