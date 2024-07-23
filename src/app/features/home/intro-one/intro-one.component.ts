import { Component, OnInit } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCardImage } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { FlexLayoutModule } from 'ngx-flexible-layout';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [
    MatIcon,
    MatButton,
    MatButtonModule,
    FlexLayoutModule,
    MatCardImage,
    MatTabGroup,
    MatTab],
  templateUrl: './intro-one.component.html',
  styleUrls: ['./intro-one.component.scss']
})
export class IntroOneComponent {

  constructor() { }

  
  buyAngland() {
    window.open('');
  }
  getNGLanding() {
    window.open('');
  }
}
