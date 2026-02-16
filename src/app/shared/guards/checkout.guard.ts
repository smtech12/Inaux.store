
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class CheckoutGuard implements CanActivate {

    constructor(
        private authService: AuthService,
        private router: Router,
        private toastr: ToastrService
    ) { }

    canActivate(): boolean | UrlTree {
        const claims = this.authService.getTokenClaims();
        console.log('CheckoutGuard Claims:', claims); // Debugging

        if (!claims) {
            return true;
        }

        // Match "Role" (User provided: "Role")
        const role = claims['role'] ||
            claims['Role'] ||
            claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        // Match "EComReg" (User provided: "EComReg")
        const eComReg = claims['EComReg'] || claims['eComReg'];

        // Normalize for comparison
        const isGuest = role && role.toLowerCase() === 'guest';
        const isEComRegTrue = String(eComReg).toLowerCase() === 'true';

        console.log(`CheckoutGuard Check: isGuest=${isGuest} (Role=${role}), isEComRegTrue=${isEComRegTrue} (EComReg=${eComReg})`);

        // "EComReg": "true" + Role: "Guest" => Cannot checkout direct
        if (isGuest && isEComRegTrue) {
            this.toastr.warning('Please register to checkout.');
            this.router.navigate(['/login']);
            return false;
        }

        return true;
    }
}
