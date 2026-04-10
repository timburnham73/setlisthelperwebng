import { Component } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [
    RouterLink,
    MatIcon,
    MatButton,
    MatButtonModule,
    FlexLayoutModule],
  templateUrl: './intro-one.component.html',
  styleUrls: ['./intro-one.component.scss']
})
export class IntroOneComponent {
  videoUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/qHVv34gmEwk');
  }
}
