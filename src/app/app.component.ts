import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthenticationService } from './core/services/auth.service';

@Component({
    selector: 'app-root',
    template: `<router-outlet></router-outlet>`,
    standalone: true,
    imports: [RouterOutlet]
})
export class AppComponent {
    constructor(authService: AuthenticationService, router: Router) {
        authService.isLoggedIn$.subscribe((isLoggedIn) => {
            if(isLoggedIn){
                router.navigate(['/accounts']);
            }
          });
      }
}
