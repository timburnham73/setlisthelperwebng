import { Component } from '@angular/core';
import { LyricsComponent } from '../lyrics-view/lyrics.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgIf, NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexModule, FlexLayoutModule } from 'ngx-flexible-layout';
import { SafeHtml } from 'src/app/shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-lyric-view-wrapper',
  standalone: true,
  imports: [
    LyricsComponent,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    NgFor,
    MatOptionModule,
    MatButtonModule,
    MatMenuModule,
    SafeHtml,
    FlexModule,
    FlexLayoutModule],
  templateUrl: './lyric-view-wrapper.component.html',
  styleUrl: './lyric-view-wrapper.component.scss'
})
export class LyricViewWrapperComponent {

}
