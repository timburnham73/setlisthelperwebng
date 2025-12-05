import { Component, OnInit, Input } from '@angular/core';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatList, MatListItem } from '@angular/material/list';
import { FlexLayoutModule } from 'ngx-flexible-layout';

@Component({
  selector: 'app-pricings',
  standalone: true,
  imports: [
    MatList,
    MatListItem,
    MatCard,
    MatCardTitle,
    MatDivider,
    FlexLayoutModule,
    MatCardContent
  ],
  templateUrl: './pricings.component.html',
  styleUrls: ['./pricings.component.scss']
})
export class PricingsComponent {
  isAnnualSelected: boolean = false;
  constructor() { }

}
