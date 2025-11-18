import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef as MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Observable, catchError, concat, concatMap, first, map, mergeMap, switchMap, take, tap, throwError, zip } from 'rxjs';
import { SongEdit } from 'src/app/core/model/account-song';
import { Song } from 'src/app/core/model/song';
import { BaseUser, UserHelper } from 'src/app/core/model/user';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { Store } from '@ngxs/store';
import { SongActions } from 'src/app/core/store/song.actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgIf } from '@angular/common';
import { SetlistSong } from 'src/app/core/model/setlist-song';
import { SetlistSongFactory } from 'src/app/core/model/factory/setlist-song.factory';
import { SetlistSongService } from 'src/app/core/services/setlist-songs.service';
import { SongService } from 'src/app/core/services/song.service';
import { MatDivider } from '@angular/material/divider';
import { SetlistService } from 'src/app/core/services/setlist.service';
import { Setlist } from 'src/app/core/model/setlist';

@Component({
  selector: 'app-song-edit-dialog',
  templateUrl: './song-edit-dialog.component.html',
  styleUrls: ['./song-edit-dialog.component.css'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, NgIf, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatCheckboxModule, MatButtonModule, MatIconModule, MatDivider, MatProgressSpinnerModule]
})
export class SongEditDialogComponent {
  currentUser: BaseUser;
  saving = false;
  isNew = true;
  isBreak = false;
  song: Song | SetlistSong | undefined;
  accountId: string | undefined;
  setlistId: string | undefined;
  setlist: Setlist;
  songForm: FormGroup;
  get name() { return this.songForm.get('name'); }

  constructor(
    public dialogRef: MatDialogRef<SongEditDialogComponent>,
    private store: Store,
    private setlistService: SetlistService,
    private setlistSongService: SetlistSongService,
    private songService: SongService,
    private authService: AuthenticationService,
    @Inject(MAT_DIALOG_DATA) public data: SongEdit,
  ) { 
    
    if(this.data.song && Object.keys(this.data.song).length){
      this.song = this.data.song;
      this.isNew = false;
      this.isBreak = this.song['isBreak'] ? true : false;
    }

    this.accountId = this.data.accountId;
    this.setlistId = this.data.setlistId;
    if(this.accountId && this.setlistId){
      this.setlistService.getSetlist(this.accountId, this.setlistId).pipe(first())
      .subscribe((setlist) => {
        if (setlist) {
          this.setlist = setlist;
        }
      });
    }

    this.authService.user$.subscribe((user) => {
      if (user && user.uid) {
        this.currentUser = UserHelper.getForUpdate(user);
      }
    });

    this.songForm = new FormGroup({
      name: new FormControl(this.song?.name || '', Validators.required),
      artist: new FormControl(this.song?.artist || ''),
      genre: new FormControl(this.song?.genre || ''),
      key: new FormControl(this.song?.key || 'C'),
      tempo: new FormControl(this.song?.tempo || 120, [Validators.min(0), Validators.max(400)]),
      lengthMin: new FormControl(this.song?.lengthMin || 3, [Validators.min(0), Validators.max(59)]),
      lengthSec: new FormControl(this.song?.lengthSec || 0, [Validators.min(0), Validators.max(59)]),
      beatValue: new FormControl(this.song?.beatValue || 4, [Validators.min(1), Validators.max(12)]),
      noteValue: new FormControl(this.song?.noteValue || 4, [Validators.min(1), Validators.max(12)]),
      notes: new FormControl(this.song?.notes || ''),
      other: new FormControl(this.song?.other || ''),
      updateOnlyThisSetlistSong: new FormControl((this.song as SetlistSong)?.updateOnlyThisSetlistSong),
      deactivated: new FormControl(this.song?.deactivated),
    });
  }

  updateOnlyThisSetlistSong() {
    return this.songForm.get('updateOnlyThisSetlistSong');
  }

  onNoClick(): void {
    this.dialogRef.close()
  }

  onSave(): void {
    this.saving = true;

    if (this.song?.id) {
      //Update setlist song
      if ((this.song as SetlistSong)?.sequenceNumber && this.setlistId) {
        if (this.updateOnlyThisSetlistSong()?.value === true || (this.song as SetlistSong)?.isBreak === true) {
          const updateSetlistSong$ = this.updateSetlistSong();
          updateSetlistSong$
            .pipe(
              tap((result) => this.dialogRef.close(result))
            )
            .subscribe();
        }
        else {

          //This is for a setlist song when editing only. 
          //When the song is updated in the function below
          //all setlist songs will be updated if they do not have the attribute updateOnlyThisSetlistSong 
          const updateSetlistSong$ = this.updateSetlistSong();
          updateSetlistSong$.pipe(
            switchMap(() =>
              this.updateSong().pipe(
                tap((result) => this.dialogRef.close(result))
              )))
            .subscribe();
        }
      }
      else {
        this.updateSong()
          .pipe(
            first(),
            tap((result) => this.dialogRef.close(result))
          )
          .subscribe();
      }
    } else {
      // Build a plain Song payload (no setlist-specific fields)
      const songPayload: any = { ...this.song, ...this.songForm.value };
      delete songPayload.sequenceNumber;
      delete songPayload.updateOnlyThisSetlistSong;

      //If this is a seltist song a seuqence number will be passed in with no songId. 
      if ((this.song as SetlistSong)?.sequenceNumber) {
        this.songService.addSong(this.accountId!, songPayload as Song, this.currentUser)
          .pipe(
            concatMap((song: Song) => {
              // Re-add setlist-specific fields when creating the SetlistSong
              const modifiedSong = { ...this.song, songId: song.id, ...this.songForm.value } as SetlistSong;
              return this.setlistSongService.addSetlistSong(modifiedSong, this.accountId!, this.setlist!, this.currentUser);
            }),
            tap((result) => this.dialogRef.close(result)),
            catchError((err) => {
              console.log(err);
              alert('Could not add song.');
              return throwError(() => new Error(err));
            })
          )
          .subscribe();
      }
      else {
        this.songService.addSong(this.accountId!, songPayload as Song, this.currentUser)
          .pipe(
            first(),
            tap(() => this.dialogRef.close()),
            catchError((err) => {
              console.log(err);
              alert('Could not add song.');
              return throwError(() => new Error(err));
            })
          )
          .subscribe();
      }
    }
  }

  updateSetlistSong() {
    const modifiedSong = { ...this.song, ...this.songForm.value } as SetlistSong;
    return this.setlistSongService.updateSetlistSong(this.song?.id!, this.accountId!, this.setlistId!, modifiedSong, this.currentUser)
      .pipe(
        catchError((err) => {
          console.log(err);
          alert('Could not update song');
          return throwError(() => new Error(err));
        })
      );
  }

  updateSetlistSongAll() {
    const modifiedSong = { ...this.song, ...this.songForm.value } as SetlistSong;
    const masterSongId = (modifiedSong as SetlistSong).songId ?? (modifiedSong as any).id;
    return this.setlistSongService.updateSetlistSongsBySongId(this.accountId!, masterSongId!, modifiedSong, this.currentUser);
  }

  updateSong() {
    const formValue: any = { ...this.songForm.value };
    const isSetlistSong = !!(this.song as SetlistSong)?.sequenceNumber && this.setlistId;

    // When updating a plain Song, do not include updateOnlyThisSetlistSong in the payload
    if (!isSetlistSong) {
      delete formValue.sequenceNumber;
      delete formValue.updateOnlyThisSetlistSong;
    }

    let modifiedSong = { ...this.song, ...formValue } as Song;
    const setlistSong = modifiedSong as SetlistSong;
    //If we are updating a setlist song then the master song needs updating. 
    if (setlistSong?.sequenceNumber && this.setlistId) {
      const setlistSongFactory = new SetlistSongFactory(this.currentUser);
      modifiedSong = setlistSongFactory.getSongFromSetlistSong(modifiedSong as SetlistSong);
    }

    return this.store.dispatch(new SongActions.UpdateSong(this.accountId!, modifiedSong?.id!, modifiedSong, this.currentUser))
      .pipe(
        catchError((err) => {
          console.log(err);
          alert('Could not update song.');
          return throwError(() => new Error(err));
        })
      );
  }

  //Show "Update only this Setlist Song" only when editing an existing SetlistSong
  isEditingSetlistSong() {
    return !!(this.song as SetlistSong)?.sequenceNumber && !this.isNew;
  }

  isAddingNewSong() {
    if (this.song?.id) {
      return false;
    }
    return true;
  }
}
