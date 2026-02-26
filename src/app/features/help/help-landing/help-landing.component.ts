import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-help-landing',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatCardModule, MatIconModule],
  templateUrl: './help-landing.component.html',
  styleUrls: ['./help-landing.component.css']
})
export class HelpLandingComponent implements OnInit {
  constructor(
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Band Central - Help & Support');
    this.meta.updateTag({ name: 'description', content: 'Get help with Band Central for iOS, Android, and web. Find answers to common questions about songs, setlists, lyrics, ChordPro, and more.' });
  }
}
