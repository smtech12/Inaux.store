import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-extra-info',
  templateUrl: './extra-info.component.html',
  styleUrls: ['./extra-info.component.scss']
})
export class ExtraInfoComponent implements OnInit, OnDestroy {
  public userName: string = 'Guest';
  private tokenSubscription: Subscription = new Subscription();

  constructor(public authService: AuthService) { }

  ngOnInit() {
    this.updateUserName();
    
    // Subscribe to token changes to update name when user logs in/out
    this.tokenSubscription = this.authService.getToken$().subscribe(() => {
      this.updateUserName();
    });
  }

  ngOnDestroy() {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  /**
   * Update user name from token or set to Guest
   */
  private updateUserName(): void {
    const name = this.authService.getName();
    this.userName = name || 'Guest';
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.authService.hasToken() && this.userName !== 'Guest';
  }

  /**
   * Handle logout - clear tokens and immediately generate new guest token
   */
  handleLogout(): void {
    // Use the new method that handles logout and immediate token generation
    this.authService.logoutWithImmediateTokenGeneration().subscribe({
      next: (token) => {
        if (token) {
          console.log('New guest token generated after logout');
        } else {
          console.warn('Failed to generate new guest token after logout');
        }
        // Update UI to reflect logout and token change
        this.updateUserName();
      },
      error: (error) => {
        console.error('Error during logout process:', error);
        // Still update UI even if token generation failed
        this.updateUserName();
      }
    });
  }
}
