import { Component } from '@angular/core';
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
export class PrivacyPolicyComponent {
  lastUpdated = 'February 16, 2026';
}
