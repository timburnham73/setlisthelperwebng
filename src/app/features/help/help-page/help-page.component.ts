import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HelpSectionComponent } from '../help-section/help-section.component';
import { HELP_CONTENT, HelpPageContent } from '../help-content';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [MatToolbarModule, RouterLink, HelpSectionComponent],
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.css']
})
export class HelpPageComponent implements OnInit {
  content!: HelpPageContent;
  platform = '';

  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.platform = this.route.snapshot.paramMap.get('platform') || 'ios';
    this.content = HELP_CONTENT[this.platform];

    if (!this.content) {
      this.content = HELP_CONTENT['ios'];
      this.platform = 'ios';
    }

    this.titleService.setTitle(this.content.pageTitle);
    this.meta.updateTag({ name: 'description', content: this.content.metaDescription });
  }
}
