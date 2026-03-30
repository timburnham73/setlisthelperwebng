import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
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
export class PricingsComponent implements OnInit {

  constructor(
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Band Central - Pricing & Subscription Plans');
    this.meta.updateTag({ name: 'description', content: 'Band Central subscription plans for bands of all sizes. Free tier with 25 songs, or upgrade for unlimited songs, setlists, and more band members.' });
  }
}
