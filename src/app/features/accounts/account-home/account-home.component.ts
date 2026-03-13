import { Component, OnInit, inject } from "@angular/core";
import { NotificationService } from "src/app/core/services/notification.service";
import { Title } from "@angular/platform-browser";
import { AuthenticationService } from "src/app/core/services/auth.service";
import { Observable, catchError, from, throwError } from "rxjs";
import { Account } from "src/app/core/model/account";
import { MatDialog as MatDialog } from "@angular/material/dialog";
import { EditAccountDialogComponent } from "../edit-account-dialog/edit-account-dialog.component";
import { Firestore, collection, collectionData } from "@angular/fire/firestore";
import { Store } from "@ngxs/store";
import { AccountActions } from "src/app/core/store/account.actions";
import { AccountState } from "src/app/core/store/account.state";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { UserService } from "src/app/core/services/user.service";
import { AccountUsersComponent } from "../account-users/account-users.component";
import { MatDividerModule } from "@angular/material/divider";
import { MatCardModule } from "@angular/material/card";
import { NgIf, NgFor, NgClass, AsyncPipe, TitleCasePipe } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { FlexLayoutModule } from "ngx-flexible-layout";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { LoginLegacySetlistHelperComponent } from "../login-legacy-setlist-helper/login-legacy-setlist-helper.component";
import { getEntitlementLimits } from "src/app/core/model/entitlement-limits";

@Component({
    selector: "app-account-home",
    templateUrl: "./account-home.component.html",
    styleUrls: ["./account-home.component.scss"],
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        FlexLayoutModule,
        NgIf,
        NgFor,
        NgClass,
        TitleCasePipe,
        MatCardModule,
        MatDividerModule,
        RouterLink,
        AsyncPipe,
    ],
})
export class AccountHomeComponent implements OnInit {
  currentUser: any;
  accounts$: Observable<Account[]>;
  private entitlementLevel: string = 'free';

  constructor(
    private authService: AuthenticationService,
    private titleService: Title,
    private store: Store,
    private router: Router,
    public dialog: MatDialog,
    private userService: UserService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.accounts$ = this.store.select(AccountState.all);

    this.authService.user$.subscribe((user) => {
      if(user && user.uid){
        this.currentUser = user;
        this.store.dispatch(new AccountActions.LoadAccounts(user.uid));
        this.userService.getUserById(user.uid).subscribe((firestoreUser) => {
          this.entitlementLevel = firestoreUser?.entitlementLevel ?? 'free';
        });
      }
    });
  }

  ngOnInit() {
    this.titleService.setTitle("Bands");
  }

  onSelectAccount(selectAccount: Account) {
    this.store.dispatch(new AccountActions.selectAccount(selectAccount));
    this.router.navigate([selectAccount.id + '/songs'], { relativeTo: this.route });
  }

  onAddAccount() {
    const limits = getEntitlementLimits(this.entitlementLevel);
    const currentBands = this.store.selectSnapshot(AccountState.all);
    if (limits.maxBands !== null && currentBands.length >= limits.maxBands) {
      this.notificationService.openSnackBar(
        `Your plan allows up to ${limits.maxBands} band${limits.maxBands === 1 ? '' : 's'}. Upgrade your subscription to add more.`
      );
      return;
    }

    const dialogRef = this.dialog.open(EditAccountDialogComponent, {
      data: {},
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.store.dispatch(new AccountActions.LoadAccounts(this.currentUser.uid));
      }
    });
  }

  onImportAccount(account: Account) {
    
      const dialogRef = this.dialog.open(LoginLegacySetlistHelperComponent, {
        data: account.id,
        panelClass: "dialog-responsive",
      });
  
      dialogRef.afterClosed().subscribe((data) => {
        
      });
  }

  onEditAccount(account: Account) {
    const dialogRef = this.dialog.open(EditAccountDialogComponent, {
      data: account,
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.store.dispatch(new AccountActions.LoadAccounts(this.currentUser.uid));
      }
    });
  }

  onAddOrRemoveAccountUsers(account: Account) {
    const dialogRef = this.dialog.open(AccountUsersComponent, {
      data: account,
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.store.dispatch(new AccountActions.LoadAccounts(this.currentUser.uid));
      }
    });
  }
}
