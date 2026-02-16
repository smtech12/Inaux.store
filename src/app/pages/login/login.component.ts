import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService, CustomerLoginRequest } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  isShowPass = false;
  public loginForm!: FormGroup;
  public formSubmitted = false;
  public isLoading = false;

  constructor(
    private toastrService: ToastrService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required, Validators.minLength(6)]),
    });
  }

  handleShowPass() {
    this.isShowPass = !this.isShowPass;
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.loginForm.valid) {
      this.isLoading = true;

      const request: CustomerLoginRequest = {
        Email: this.loginForm.value.email,
        Password: this.loginForm.value.password,
      };

      this.authService.loginCustomer(request).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Handle both Token (PascalCase) and token (camelCase) for compatibility
          const token = response.successData?.Token || response.successData?.token;
          if (response.statusCode === 200 && token) {
            // Clear all existing tokens and store customer token as 'cus_token'
            this.authService.setCustomerToken(token);
            this.toastrService.success('Login successful! Welcome back!');

            // Reset the form
            this.loginForm.reset();
            this.formSubmitted = false;

            // Navigate to home page
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 1000);
          } else {
            this.toastrService.error(response.message || 'Login failed');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);

          // Handle error response
          if (error.error && error.error.errorData) {
            this.toastrService.error(error.error.errorData || error.error.message || 'Login failed');
          } else if (error.error && error.error.message) {
            this.toastrService.error(error.error.message);
          } else {
            this.toastrService.error('An error occurred during login. Please try again.');
          }
        }
      });
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
