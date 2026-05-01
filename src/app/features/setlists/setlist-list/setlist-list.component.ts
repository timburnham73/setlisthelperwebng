import { Component, OnInit, ViewChild } from "@angular/core";
import { SetlistEditDialogComponent } from "../setlist-edit-dialog/setlist-edit-dialog.component";
import { AccountActions } from "src/app/core/store/account.actions";
import { AccountState } from "src/app/core/store/account.state";
import { MatDialog as MatDialog } from "@angular/material/dialog";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { Select, Store } from "@ngxs/store";
import { Observable, finalize, first } from "rxjs";
import { Account } from "src/app/core/model/account";
import { SetlistService } from "src/app/core/services/setlist.service";
import { AccountSetlist } from "src/app/core/model/account-setlist";
import { Setlist } from "src/app/core/model/setlist";
import { SetlistSongService } from "src/app/core/services/setlist-songs.service";
import { SetlistSong } from "src/app/core/model/setlist-song";
import { NgIf, NgClass, NgFor, DatePipe } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCardModule } from "@angular/material/card";
import { MatMenuModule } from "@angular/material/menu";
import { MatDividerModule } from "@angular/material/divider";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FlexLayoutModule } from "ngx-flexible-layout";
import { AuthenticationService } from "src/app/core/services/auth.service";
import { CONFIRM_DIALOG_RESULT, ConfirmDialogComponent } from "src/app/shared/confirm-dialog/confirm-dialog.component";
import { NotificationService } from "src/app/core/services/notification.service";
import { UserService } from "src/app/core/services/user.service";
import { getEntitlementLimits } from "src/app/core/model/entitlement-limits";

type SortField = "name" | "gigDate" | "gigLocation";
type SortDirection = "asc" | "desc";

@Component({
    selector: "app-setlist-list",
    templateUrl: "./setlist-list.component.html",
    styleUrls: ["./setlist-list.component.css"],
    standalone: true,
    imports: [
        FlexLayoutModule,
        MatCardModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        MatTooltipModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        NgIf,
        NgClass,
        NgFor,
        DatePipe
    ],
})
export class SetlistListComponent implements OnInit {
  @Select(AccountState.selectedAccount)
  selectedAccount$!: Observable<Account>;
  currentUser: any;
  showRemove = false;
  isSystemAdmin = false;

  loading = false;

  setlists: Setlist[];
  filteredSetlists: Setlist[];

  accountId?: string;
  selectedSetlist?: Setlist;
  setlistSongs: SetlistSong[];

  // Default sort: newest gig first
  currentSortField: SortField = "gigDate";
  currentSortDirection: SortDirection = "desc";

  //Used to display the sequence for the setlist songs.
  displaySequence = 1;
  //Used for numbering the rows to skip the
  setlistBreakCount = 0;

  private selectedAccount: Account;
  private isWideScreen = false;

  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private setlistService: SetlistService,
    private setlistSongsService: SetlistSongService,
    private authService: AuthenticationService,
    private notificationService: NotificationService,
    private userService: UserService,
    private store: Store,
    private router: Router,
    public dialog: MatDialog
  ) {

    this.authService.user$.subscribe((user) => {
      if(user && user.uid){
        this.currentUser = user;
        this.userService.getUserById(user.uid).subscribe((userData) => {
          this.isSystemAdmin = userData?.systemAdmin === true;
        });
      }
    });

    this.selectedAccount = this.store.selectSnapshot(
      AccountState.selectedAccount
    );

    this.loading = true;

    const id = this.route.snapshot.paramMap.get("accountid");
    if (id) {
      this.accountId = id;
      this.fetchSetlists(true);
    }

    if (typeof window !== "undefined" && window.matchMedia) {
      const wideQuery = window.matchMedia("(min-width: 1280px)");
      this.isWideScreen = wideQuery.matches;
      wideQuery.addEventListener?.("change", (e) => (this.isWideScreen = e.matches));
    }
  }

  ngOnInit() {
    this.titleService.setTitle("Setlists");
  }

  private fetchSetlists(autoSelectFirst = false) {
    if (!this.accountId) return;
    this.loading = true;
    this.setlistService
      .getSetlists(this.accountId, this.currentSortField, this.currentSortDirection)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((setlists) => {
        this.setlists = this.filteredSetlists = setlists;
        if (autoSelectFirst && setlists?.length && this.selectedSetlist === undefined) {
          this.selectRow(setlists[0]);
        }
      });
  }

  onAddSetlist() {
    const account = this.store.selectSnapshot(AccountState.selectedAccount);
    const limits = getEntitlementLimits(account?.entitlementLevel);
    if (limits.maxSetlists !== null && (account?.countOfSetlists ?? 0) >= limits.maxSetlists) {
      this.notificationService.openSnackBar(
        `Your plan allows up to ${limits.maxSetlists} setlist${limits.maxSetlists === 1 ? '' : 's'}. Upgrade your subscription to add more.`
      );
      return;
    }
    this.dialog.open(SetlistEditDialogComponent, {
      data: { accountId: this.accountId } as AccountSetlist,
      panelClass: "dialog-responsive",
    }).afterClosed().subscribe((setlist) => {
      if(setlist){
        this.router.navigate([setlist.id + '/songs'], { relativeTo: this.route } );
      }
    });
  }

  onEditSetlist(event, row: any) {
    event?.preventDefault();
    this.dialog.open(SetlistEditDialogComponent, {
      data: { accountId: this.accountId, setlist: row } as AccountSetlist,
      panelClass: "dialog-responsive",
    });
  }

  onDuplicateSetlist(event, source: Setlist) {
    event?.preventDefault();
    event?.stopPropagation?.();
    const account = this.store.selectSnapshot(AccountState.selectedAccount);
    const limits = getEntitlementLimits(account?.entitlementLevel);
    if (limits.maxSetlists !== null && (account?.countOfSetlists ?? 0) >= limits.maxSetlists) {
      this.notificationService.openSnackBar(
        `Your plan allows up to ${limits.maxSetlists} setlist${limits.maxSetlists === 1 ? '' : 's'}. Upgrade your subscription to duplicate more.`
      );
      return;
    }
    const editingUser = {
      uid: this.currentUser?.uid,
      displayName: this.currentUser?.displayName ?? '',
      email: this.currentUser?.email ?? '',
    };
    this.setlistService
      .duplicateSetlist(this.accountId!, source, editingUser as any)
      .pipe(first())
      .subscribe({
        next: () => {
          this.notificationService.openSnackBar(`Duplicated "${source.name}"`);
        },
        error: (err) => {
          console.error('Duplicate setlist failed:', err);
          const msg = err?.message || err?.code || 'unknown error';
          this.notificationService.openSnackBar(`Could not duplicate setlist: ${msg}`);
        }
      });
  }

  onViewSetlistSongs(event, row: any) {
    event?.preventDefault();
    this.router.navigate([row.id + '/songs'], { relativeTo: this.route } );
  }

  onPrintSetlist(){
    if (!this.selectedSetlist) return;
    this.router.navigate([this.selectedSetlist.id + '/print'], { relativeTo: this.route } );
  }

  /**
   * Row tap behavior:
   *  - delete mode → no-op (the trash icon handles delete via stopPropagation)
   *  - wide screen master-detail → select row, load preview pane
   *  - narrow screen → navigate to /songs
   */
  onRowClick(event: Event, row: Setlist) {
    if (this.showRemove) return;
    if (this.isWideScreen) {
      this.selectRow(row);
    } else {
      this.onViewSetlistSongs(event, row);
    }
  }

  onRemoveSetlist(event, setlistToDelete: Setlist) {
    event?.preventDefault();
    if (this.currentUser?.uid !== this.selectedAccount?.ownerUser?.uid) {
      this.notificationService.openSnackBar("Only the band owner can delete this item.");
      return;
    }

    const message = `Are you sure you want to delete "${setlistToDelete.name}"?`;
    const message2 = this.formatGigContext(setlistToDelete);

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: "Delete setlist",
        message,
        message2,
        okButtonText: "Delete",
        cancelButtonText: "Cancel"
      },
      panelClass: "dialog-responsive",
      width: '320px',
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',
    })
    .afterClosed().subscribe((data) => {
      if(data && data.result === CONFIRM_DIALOG_RESULT.OK){
        this.setlistService
          .removeSetlist(setlistToDelete, this.accountId!, this.currentUser)
          .pipe(first())
          .subscribe();
      }
    });
  }

  /** Returns "Chilliwack · May 1, 2026 5:30 PM" or just the date or location, or empty. */
  private formatGigContext(setlist: Setlist): string {
    const parts: string[] = [];
    if (setlist.gigLocation) parts.push(setlist.gigLocation);
    const ms = this.getSetlistDateInSeconds(setlist);
    if (ms && !isNaN(ms)) {
      const d = new Date(ms);
      parts.push(d.toLocaleString(undefined, {
        month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      }));
    }
    return parts.join(" · ");
  }

  onEnableDeleteMode() {
    this.showRemove = !this.showRemove;
  }

  selectRow(row) {
    if (this.selectedSetlist === undefined || this.selectedSetlist?.id !== row.id) {
      this.setlistSongs = [];
      this.displaySequence = 1;
      this.setlistBreakCount = 0;
      this.selectedSetlist = row;
      this.setlistSongsService
        .getOrderedSetlistSongs(this.accountId!, this.selectedSetlist!.id!)
        .subscribe((setlistSongs) => {
          this.setlistSongs = setlistSongs.map((song, index) => {
            const breakCount = setlistSongs.slice(0, index).filter(s => s.isBreak === true).length;
            const sequenceNumber = (index + 1) - breakCount;
            if(!song.isBreak){
              return {...song, sequenceNumber};
            }
            return {...song, sequenceNumber: sequenceNumber + .01};
          });
        });
    }
  }

  search(search: string){
    const q = (search ?? "").toLowerCase();
    this.filteredSetlists = this.setlists.filter((setlist) => setlist.name?.toLowerCase().includes(q));
  }

  onSortChange(field: SortField, direction: SortDirection) {
    this.currentSortField = field;
    this.currentSortDirection = direction;
    this.fetchSetlists();
  }

  isCurrentSort(field: SortField, direction: SortDirection): boolean {
    return this.currentSortField === field && this.currentSortDirection === direction;
  }

  getSortLabel(): string {
    if (this.currentSortField === "name") {
      return this.currentSortDirection === "asc" ? "Name A→Z" : "Name Z→A";
    }
    if (this.currentSortField === "gigDate") {
      return this.currentSortDirection === "desc" ? "Newest first" : "Oldest first";
    }
    return "Location";
  }

  getSetlistDateInSeconds(setlist: Setlist): number | null {
    return setlist.gigDate?.seconds ? setlist.gigDate.seconds * 1000 : null;
  }
}
