import { NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSpinner } from '@angular/material/progress-spinner';
import { BaseUser, UserHelper } from 'functions/src/model/user';
import { catchError, first, tap, throwError } from 'rxjs';
import { AccountTag } from 'src/app/core/model/account-tag';
import { Tag } from 'src/app/core/model/tag';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { TagService } from 'src/app/core/services/tag.service';

@Component({
  selector: 'app-tag-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButton,
     NgIf, 
     MatFormField, 
     MatLabel, 
     MatDialogContent, 
     MatIcon, 
     MatFormFieldModule, 
      MatInputModule, 
     MatSpinner,
     MatDialogActions],
  templateUrl: './tag-edit-dialog.component.html',
  styleUrl: './tag-edit-dialog.component.scss'
})
export class TagEditDialogComponent {
  saving: boolean = false;
  isNew: boolean;
  tag: Tag | undefined;
  oldTagName: string | undefined;
  accountId: string | undefined;
  currentUser: BaseUser;
  tagForm: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<TagEditDialogComponent>,
    private tagService: TagService,
    private authService: AuthenticationService,
    @Inject(MAT_DIALOG_DATA) public data: AccountTag,
  ) {
    if(this.data.tag && Object.keys(this.data.tag).length){
      this.tag = this.data.tag;
      this.oldTagName = this.data.tag.name;
      this.isNew = false;
    }
    this.accountId = this.data.accountId;

    this.authService.user$.subscribe((user) => {
      if (user && user.uid) {
        this.currentUser = UserHelper.getForUpdate(user);
      }
    });

    this.tagForm = new FormGroup({
      name: new FormControl(this.tag?.name || '', Validators.required),
    });
  }

  onSave(){
    this.saving = true;
    if (this.tag?.id) {
      const modifiedTag = this.tagForm.value as Tag;
      modifiedTag.id = this.tag.id;
      this.tagService.renameTag(this.accountId!, this.oldTagName!, modifiedTag, this.currentUser).pipe(
        first(),
        tap((result) => this.dialogRef.close(result))
      )
      .subscribe();
    }
    else{
      this.addTag()
          .pipe(
            first(),
            tap((result) => this.dialogRef.close(result))
          )
          .subscribe();
    }
  }

  addTag() {
    const modifiedTag = { ...this.tag, ...this.tagForm.value } as Tag;
    return this.tagService.addTag(this.accountId!, modifiedTag, this.currentUser)
      .pipe(
        catchError((err) => {
          console.log(err);
          alert('Could not add tag.');
          return throwError(() => new Error(err));
        })
      );
  }

  onNoClick(): void {
    this.dialogRef.close()
  }
}
