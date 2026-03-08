import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FlexLayoutModule } from 'ngx-flexible-layout';

@Component({
  selector: 'app-pricings',
  standalone: true,
  imports: [
    MatButton,
    FlexLayoutModule
  ],
  templateUrl: './pricings.component.html',
  styleUrls: ['./pricings.component.scss']
})
export class PricingsComponent {

  constructor() { }

}
