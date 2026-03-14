import { Component, Inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Lyric } from 'src/app/core/model/lyric';

export interface LyricVersionsDialogData {
  lyrics: Lyric[];
  selectedLyricId: string | undefined;
  defaultLyricId: string | undefined;
}

export interface LyricVersionsDialogResult {
  action: 'select' | 'add' | 'setDefault';
  lyricId?: string;
}

@Component({
  selector: 'app-lyric-versions-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    NgFor,
    NgIf,
  ],
  templateUrl: './lyric-versions-dialog.component.html',
  styleUrl: './lyric-versions-dialog.component.css',
})
export class LyricVersionsDialogComponent {
  lyrics: Lyric[];
  selectedLyricId: string | undefined;
  defaultLyricId: string | undefined;

  constructor(
    public dialogRef: MatDialogRef<LyricVersionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LyricVersionsDialogData,
  ) {
    this.lyrics = data.lyrics;
    this.selectedLyricId = data.selectedLyricId;
    this.defaultLyricId = data.defaultLyricId;
  }

  onVersionChange(value: string) {
    if (value === 'add') {
      this.dialogRef.close({ action: 'add' } as LyricVersionsDialogResult);
    } else {
      this.dialogRef.close({ action: 'select', lyricId: value } as LyricVersionsDialogResult);
    }
  }

  onSetDefault() {
    this.dialogRef.close({ action: 'setDefault', lyricId: this.selectedLyricId } as LyricVersionsDialogResult);
  }

  onClose() {
    this.dialogRef.close();
  }
}
