import { Component } from '@angular/core';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ScrollToDirective } from 'src/app/shared/directives/scroll-to.directive';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    FlexLayoutModule,
    ScrollToDirective
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
