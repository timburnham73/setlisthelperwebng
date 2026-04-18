import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
        if (isPlatformBrowser(inject(PLATFORM_ID))) {
            router.events.subscribe((event: any) => {
                if (event.type === 1) {
                    if (event.url === '/' || event.url === '/home' || event.url === '/auth/login')
                        authService.isLoggedIn$.subscribe((isLoggedIn) => {
                            if (isLoggedIn) {
                                router.navigate(['/bands']);
                            }
                        });
                }
            });
        }
    }
}
