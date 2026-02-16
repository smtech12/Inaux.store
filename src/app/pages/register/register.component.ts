import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService, CustomerRegisterRequest } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  isShowPass = false;
  public registerForm!: FormGroup;
  public formSubmitted = false;
  public isLoading = false;

  constructor(
    private toastrService: ToastrService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.registerForm = new FormGroup({
      name: new FormControl(null, [Validators.required]),
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required, Validators.minLength(6)]),
      phoneNumber: new FormControl(null),
      secPhoneNumber: new FormControl(null),
      address: new FormControl(null),
    });
  }

  handleShowPass() {
    this.isShowPass = !this.isShowPass;
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.registerForm.valid) {
      this.isLoading = true;

      const request: CustomerRegisterRequest = {
        Name: this.registerForm.value.name,
        Email: this.registerForm.value.email,
        Password: this.registerForm.value.password,
        PhoneNumber: this.registerForm.value.phoneNumber || null,
        SecPhoneNumber: this.registerForm.value.secPhoneNumber || null,
        Address: this.registerForm.value.address || null,
      };

      this.authService.registerCustomer(request).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Handle both Token (PascalCase) and token (camelCase) for compatibility
          const token = response.successData?.Token || response.successData?.token;
          if (response.statusCode === 201 && token) {
            // Clear all existing tokens and store customer token as 'cus_token'
            this.authService.setCustomerToken(token);
            this.toastrService.success('Registration successful! Welcome!');

            // Reset the form
            this.registerForm.reset();
            this.formSubmitted = false;

            // Navigate to home or login page
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 1000);
          } else {
            this.toastrService.error(response.message || 'Registration failed');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);

          // Handle error response
          if (error.error && error.error.errorData) {
            this.toastrService.error(error.error.errorData || error.error.message || 'Registration failed');
          } else if (error.error && error.error.message) {
            this.toastrService.error(error.error.message);
          } else {
            this.toastrService.error('An error occurred during registration. Please try again.');
          }
        }
      });
    }
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get phoneNumber() { return this.registerForm.get('phoneNumber'); }
  get secPhoneNumber() { return this.registerForm.get('secPhoneNumber'); }
  get address() { return this.registerForm.get('address'); }

}
