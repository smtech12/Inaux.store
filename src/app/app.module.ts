import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ShopModule } from './shop/shop.module';
import { PagesModule } from './pages/pages.module';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { AuthService } from './shared/services/auth.service';
import { environment } from '../environments/environment';

/**
 * Factory function to initialize token on app startup
 */
export function initializeApp(authService: AuthService): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve) => {
      // Check if token already exists in localStorage
      if (authService.hasToken()) {
        console.log('Token already exists in localStorage');
        resolve();
        return;
      }

      // Generate new token if not exists
      authService.generateToken(environment.GUEST_TOKEN_SECRET_KEY).subscribe({
        next: (token) => {
          if (token) {
            console.log('Guest token generated and stored successfully');
          } else {
            console.warn('Failed to generate guest token');
          }
          resolve();
        },
        error: (error) => {
          console.error('Error initializing token:', error);
          resolve(); // Resolve anyway to allow app to continue
        }
      });
    });
  };
}

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedModule,
    ShopModule,
    PagesModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      progressBar: false,
      enableHtml: true,
      positionClass: 'toast-top-center'
    }),
    AppRoutingModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})

export class AppModule { };
