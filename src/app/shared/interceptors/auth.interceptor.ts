import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private tokenRefreshSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip token injection for the generate-token endpoint (to avoid circular dependency)
    if (request.url.includes('/generate-token')) {
      return next.handle(request);
    }

    // Get token from AuthService
    const token = this.authService.getToken();

    // Clone the request and add Authorization header if token exists
    let clonedRequest = request;
    if (token) {
      clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Handle the request and catch 401 errors
    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Check if error is 401 Unauthorized
        if (error.status === 401 && !request.url.includes('/generate-token')) {
          // Generate new token and retry the request
          return this.handle401Error(clonedRequest, next);
        }
        // Re-throw other errors
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // If token refresh is already in progress, wait for it to complete
    if (this.isRefreshing) {
      return this.tokenRefreshSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((newToken) => {
          if (newToken) {
            // Retry the original request with the new token
            const retryRequest = request.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next.handle(retryRequest);
          } else {
            return throwError(() => new HttpErrorResponse({
              error: 'Token generation failed',
              status: 401,
              statusText: 'Unauthorized'
            }));
          }
        })
      );
    }

    // Start token refresh process
    this.isRefreshing = true;
    this.tokenRefreshSubject.next(null);

    // Generate new token
    return this.authService.generateToken(environment.GUEST_TOKEN_SECRET_KEY).pipe(
      switchMap((newToken) => {
        if (newToken) {
          // Store the new token in the subject so queued requests can use it
          this.tokenRefreshSubject.next(newToken);
          
          // Retry the original request with the new token
          const retryRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`
            }
          });
          return next.handle(retryRequest);
        } else {
          // If token generation failed, notify all waiting requests
          this.tokenRefreshSubject.next(null);
          return throwError(() => new HttpErrorResponse({
            error: 'Token generation failed',
            status: 401,
            statusText: 'Unauthorized'
          }));
        }
      }),
      catchError((error) => {
        // If token generation fails, notify all waiting requests
        this.tokenRefreshSubject.next(null);
        return throwError(() => error);
      }),
      finalize(() => {
        // Reset the refreshing flag after token refresh completes
        this.isRefreshing = false;
      })
    );
  }
}

