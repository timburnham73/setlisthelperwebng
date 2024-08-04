import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { AuthenticationService } from './core/services/auth.service';

@Component({
    selector: 'app-root',
    template: `<router-outlet></router-outlet>`,
    standalone: true,
    imports: [RouterOutlet]
})
export class AppComponent {
    constructor(authService: AuthenticationService, router: Router) {
        router.events.subscribe((event:any) => {
            if(event.type === 1){
                console.log(event);
                if (event.url === '/home' || event.url === '/auth/login')
                    authService.isLoggedIn$.subscribe((isLoggedIn) => {
                        if(isLoggedIn){
                            router.navigate(['/accounts']);   
                        }
                      });
            }
    });
  } 
}
