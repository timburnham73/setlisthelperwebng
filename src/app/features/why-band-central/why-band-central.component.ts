import { Component, OnInit } from '@angular/core';
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
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
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer
  ) {
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/qHVv34gmEwk');
  }

  ngOnInit(): void {
    this.titleService.setTitle('Why Band Central? | Band Central');
    this.metaService.updateTag({
      name: 'description',
      content: 'Band Central is the collaboration platform for bands and worship teams. Real-time sync, per-member lyrics, multiple bands, and more.'
    });
  }
}
