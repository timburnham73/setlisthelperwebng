import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-expand-icon',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './expand-icon.component.html',
  styleUrl: './expand-icon.component.scss'
})
export class ExpandIconComponent {
  isOpen = input<boolean>(false);
}
