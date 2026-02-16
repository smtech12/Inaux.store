import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponseMessage } from '../types/product-list-model';
import { TenantHeaderInfoDTO } from '../types/tenant-header-model';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private baseUrl = environment.API_BASE_URL + '/WebFront';
  
  // Cache the Observable to ensure API is called only once
  private cachedTenantHeaderInfo$: Observable<TenantHeaderInfoDTO | null> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get tenant header information (contact info, logo, branches)
   * Caches the result so the API is called only once
   * @returns Observable of TenantHeaderInfoDTO
   */
  public getTenantHeaderInfo(): Observable<TenantHeaderInfoDTO | null> {
    // If already cached, return the cached Observable
    if (!this.cachedTenantHeaderInfo$) {
      this.cachedTenantHeaderInfo$ = this.http.get<ApiResponseMessage<TenantHeaderInfoDTO>>(`${this.baseUrl}/get-header-info`)
        .pipe(
          map(response => {
            if (response && response.successData) {
              return response.successData;
            }
            return null;
          }),
          catchError(error => {
            console.error('Error fetching tenant header info from API:', error);
            return of(null);
          }),
          shareReplay(1) // Cache and share the result across all subscribers
        );
    }
    
    return this.cachedTenantHeaderInfo$;
  }
}

