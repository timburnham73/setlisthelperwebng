import { Component } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FlexLayoutModule } from 'ngx-flexible-layout';

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

  constructor() { }

}
