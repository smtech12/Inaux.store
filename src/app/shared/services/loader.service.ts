import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor() { }

  /**
   * Show the loader
   */
  show(): void {
    this.loadingSubject.next(true);
  }

  /**
   * Hide the loader
   */
  hide(): void {
    this.loadingSubject.next(false);
  }

  /**
   * Get current loading state
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}

