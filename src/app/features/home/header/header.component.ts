import { Component, OnInit, HostListener, HostBinding, Inject, Input } from '@angular/core';
import { DOCUMENT, NgClass } from '@angular/common';
import { WINDOW_PROVIDERS, WINDOW } from '../../../shared/helpers/window.helper';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ScrollToDirective } from 'src/app/shared/directives/scroll-to.directive';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatIcon,
    NgClass,
    MatIconButton,
    MatButton,
    FlexLayoutModule,
    ScrollToDirective
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  isFixed;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
    private router: Router
  ) { }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    const offset = this.window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    if(offset > 10) {
      this.isFixed = true
    } else {
      this.isFixed = false;
    }
  }

  @HostBinding("class.menu-opened") menuOpened = false;

  toggleMenu() {
    this.menuOpened = !this.menuOpened
  }

  navigateToHelp() {
    this.menuOpened = false;
    this.router.navigate(['/help']);
  }

  buyAngland() {
    this.window.open('');
  }

}
