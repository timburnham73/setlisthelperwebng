import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { SeoService } from '../../core/services/seo.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';
import { HeaderComponent } from '../home/header/header.component';
import { FooterComponent } from '../home/footer/footer.component';

@Component({
  selector: 'app-why-band-central',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    NgFor,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './why-band-central.component.html',
  styleUrls: ['./why-band-central.component.css']
})
export class WhyBandCentralComponent implements OnInit {
  videoUrl: SafeResourceUrl;

  constructor(
    private seoService: SeoService,
    private sanitizer: DomSanitizer
  ) {
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/qHVv34gmEwk');
  }

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'Why Band Central - Built for Working Musicians',
      description: 'Why bands choose Band Central: real-time sync, ChordPro support, setlist planning, and cross-device collaboration. Built by musicians for musicians.',
      url: 'https://www.bandcentral.com/why',
    });
    this.seoService.clearJsonLd();
  }
}
