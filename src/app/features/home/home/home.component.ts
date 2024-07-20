import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { IntroOneComponent } from '../intro-one/intro-one.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    IntroOneComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
