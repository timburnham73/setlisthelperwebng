import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ExportColumn {
  key: string;
  label: string;
  selected: boolean;
}

export interface ExportDialogData {
  columns: ExportColumn[];
  format: 'csv' | 'html';
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule, NgFor, FormsModule],
  templateUrl: './export-dialog.component.html',
  styleUrl: './export-dialog.component.scss'
})
export class ExportDialogComponent {
  columns: ExportColumn[];
  format: 'csv' | 'html';

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData,
  ) {
    this.columns = data.columns.map(c => ({ ...c }));
    this.format = data.format || 'csv';
  }

  get hasSelection(): boolean {
    return this.columns.some(c => c.selected);
  }

  get allSelected(): boolean {
    return this.columns.every(c => c.selected);
  }

  get someSelected(): boolean {
    return this.columns.some(c => c.selected);
  }

  onSelectAll(): void {
    const allSelected = this.columns.every(c => c.selected);
    this.columns.forEach(c => c.selected = !allSelected);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onExport(): void {
    this.dialogRef.close({
      columns: this.columns.filter(c => c.selected),
      format: this.format
    });
  }
}
