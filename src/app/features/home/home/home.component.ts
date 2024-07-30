import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { IntroOneComponent } from '../intro-one/intro-one.component';
import { PricingsComponent } from '../pricings/pricings.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    IntroOneComponent,
    PricingsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
