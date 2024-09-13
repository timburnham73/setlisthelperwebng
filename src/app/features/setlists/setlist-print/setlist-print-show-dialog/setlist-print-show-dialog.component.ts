import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef as MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Timestamp } from "@angular/fire/firestore";
import { AccountSetlist } from 'src/app/core/model/account-setlist';
import { Setlist } from 'src/app/core/model/setlist';
import { BaseUser, UserHelper } from 'src/app/core/model/user';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { SetlistService } from 'src/app/core/services/setlist.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { NgIf } from '@angular/common';
import { MatNativeDateModule, ThemePalette } from '@angular/material/core';
import * as moment from 'moment';
import { MatCheckbox } from '@angular/material/checkbox';
import { AccountSetlistPrintSettings } from 'src/app/core/model/account-setlist-print-settings';
import { defaultPrintSettings, SetlistPrintSettings } from 'src/app/core/model/setlist-print-settings';
import { take } from 'rxjs';

@Component({
  selector: 'app-setlist-edit-dialog',
  templateUrl: './setlist-print-show-dialog.component.html',
  styleUrls: ['./setlist-print-show-dialog.component.scss'],
  standalone: true,

  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    MatCheckbox,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule],
})
export class SetlistPrintShowDialogComponent {
  currentUser: BaseUser;
  saving = false;
  accountId: string;
  setlistId: string;

  setlistPrintShowForm = new FormGroup({
    setlistName: new FormGroup({
      show: new FormControl(true),
    }),
    gigDateTime: new FormGroup({
      show: new FormControl(true),
    }),
    gigLocation: new FormGroup({
      show: new FormControl(true),
    }),
    artist: new FormGroup({
      show: new FormControl(true),
    }),
    genre: new FormGroup({
      show: new FormControl(true),
    }),
    songLength: new FormGroup({
      show: new FormControl(true),
    }),
    songKey: new FormGroup({
      show: new FormControl(true),
    }),
    tempo: new FormGroup({
      show: new FormControl(true),
    }),
    timeSignature: new FormGroup({
      show: new FormControl(true),
    })
  });

  constructor(
    public dialogRef: MatDialogRef<SetlistPrintShowDialogComponent>,
    private setlistService: SetlistService,
    private authService: AuthenticationService,
    @Inject(MAT_DIALOG_DATA) public accountSetlistPrintSettings: AccountSetlistPrintSettings,
  ) {

    if (!accountSetlistPrintSettings || !accountSetlistPrintSettings.printSettings) {
      accountSetlistPrintSettings.printSettings = defaultPrintSettings;
    }

    if (accountSetlistPrintSettings.accountId && accountSetlistPrintSettings.setlist.id) {
      this.accountId = accountSetlistPrintSettings.accountId;
      this.setlistId = accountSetlistPrintSettings.setlist.id;
    }
    this.setControlValues(accountSetlistPrintSettings.printSettings);
  }

  setControlValues(printSettings) {
    this.setlistPrintShowForm.controls.setlistName.controls.show.setValue(printSettings.setlistName.show);
    this.setlistPrintShowForm.controls.gigDateTime.controls.show.setValue(printSettings.gigDateTime.show);
    this.setlistPrintShowForm.controls.gigLocation.controls.show.setValue(printSettings.gigLocation.show);
    this.setlistPrintShowForm.controls.artist.controls.show.setValue(printSettings.artist.show);
    this.setlistPrintShowForm.controls.genre.controls.show.setValue(printSettings.genre.show);
    this.setlistPrintShowForm.controls.songLength.controls.show.setValue(printSettings.songLength.show);
    this.setlistPrintShowForm.controls.songKey.controls.show.setValue(printSettings.songKey.show);
    this.setlistPrintShowForm.controls.tempo.controls.show.setValue(printSettings.tempo.show);
    this.setlistPrintShowForm.controls.timeSignature.controls.show.setValue(printSettings.timeSignature.show);
  }

  onNoClick(): void {
    this.dialogRef.close()
  }

  onSave(): void {
    this.saving = true;
    const formSetlistPrintSettings = {...this.accountSetlistPrintSettings.printSettings, ...this.setlistPrintShowForm.value as SetlistPrintSettings};
    this.setlistService.setPrintSettings(this.accountId, this.setlistId, formSetlistPrintSettings)
      .subscribe((result) => {
        this.saving = false;
        
        this.dialogRef.close(formSetlistPrintSettings)
      });
  }
}
