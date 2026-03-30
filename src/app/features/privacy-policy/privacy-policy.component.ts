import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.css'],
    standalone: true,
    imports: [MatCardModule, MatToolbarModule, RouterLink]
})
export class PrivacyPolicyComponent implements OnInit {
  lastUpdated = 'February 16, 2026';

  constructor(
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Privacy Policy - Band Central');
    this.meta.updateTag({ name: 'description', content: 'Band Central privacy policy. Learn how we collect, use, and protect your data.' });
  }
}
