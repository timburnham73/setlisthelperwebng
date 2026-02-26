import { Component, Input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { HelpSection } from '../help-content';

@Component({
  selector: 'app-help-section',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule],
  templateUrl: './help-section.component.html',
  styleUrls: ['./help-section.component.css']
})
export class HelpSectionComponent {
  @Input() section!: HelpSection;
}
