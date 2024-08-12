import { DatePipe, NgFor } from '@angular/common';
import { Component, LOCALE_ID } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { Setlist } from 'src/app/core/model/setlist';
import { SetlistSong } from 'src/app/core/model/setlist-song';
import { User } from 'src/app/core/model/user';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { SetlistSongService } from 'src/app/core/services/setlist-songs.service';
import { SetlistService } from 'src/app/core/services/setlist.service';
import { AccountState } from 'src/app/core/store/account.state';

export enum PrintColumns {
  one,
  two,
  three
}

@Component({
  selector: 'app-setlist-print',
  standalone: true,
  imports: [
    NgFor,
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCard,
    MatCardContent,
    FlexLayoutModule,
    DatePipe
  ],
  templateUrl: './setlist-print.component.html',
  styleUrl: './setlist-print.component.scss'
})
export class SetlistPrintComponent {
  currentUser: User;
  accountId: string;
  setlistId: string;
  setlist?: Setlist;
  setlistSongs: SetlistSong[];
  loading: boolean;
  columns: PrintColumns = PrintColumns.two;
  hide

  public get PrintColumns(): typeof PrintColumns {
    return PrintColumns; 
  }

  constructor(
    private setlistSongsService: SetlistSongService,
    private setlistService: SetlistService,
    private authService: AuthenticationService,
    private store: Store,
    private activeRoute: ActivatedRoute,
    private router: Router,
  ){
    
    this.authService.user$.subscribe((user) => {
      if(user && user.uid){
        this.currentUser = user;
      }
    });

    const selectedAccount = this.store.selectSnapshot(
      AccountState.selectedAccount
    );
    
    this.loading = true;

    const accountId = this.activeRoute.snapshot.paramMap.get("accountid");
    const setlistId = this.activeRoute.snapshot.paramMap.get("setlistid");
    if (accountId && setlistId) {
      this.accountId = accountId;
      this.setlistId = setlistId;
      this.setlistService.getSetlist(this.accountId, this.setlistId).subscribe((setlist) => {
        this.loading = false;
        this.setlist = setlist;
      });

      this.setlistSongsService
        .getOrderedSetlistSongs(accountId, setlistId)
        .subscribe((setlistSongs) => {
          this.setlistSongs = setlistSongs.map((song, index) => {
            let breakCount = setlistSongs.slice(0, index).filter(song => song.isBreak === true).length;;
            const sequenceNumber = (index + 1) - breakCount;
            if(!song.isBreak){
              return {...song, sequenceNumber : sequenceNumber};
            }
            
            return {...song, sequenceNumber : sequenceNumber + .01};
          
          });
          console.log(this.setlistSongs);
        });
    }
  }

  onPrintSetlist(){
    let printContents = document?.getElementById("setlist-songs")?.innerHTML;
     let originalContents = document.body.innerHTML;

     if(document && document.body && document.body.innerHTML && printContents){
        document.body.innerHTML = printContents;
        window.print();

        document.body.innerHTML = originalContents;
        window.location.reload();
     }
  }

  onBackToSetlist(){
    this.router.navigate(["../.."], { relativeTo: this.activeRoute });   
  }

  onChangePrintColumn(columns: PrintColumns){
    this.columns = columns;
  }
}
function Inject(LOCALE_ID: any): (target: typeof SetlistPrintComponent, propertyKey: undefined, parameterIndex: 0) => void {
  throw new Error('Function not implemented.');
}

