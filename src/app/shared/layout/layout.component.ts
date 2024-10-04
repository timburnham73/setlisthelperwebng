import { Component, OnInit, ChangeDetectorRef, OnDestroy, AfterViewInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { Observable, timer } from 'rxjs';
import { Subscription } from 'rxjs';

import { AuthenticationService } from 'src/app/core/services/auth.service';
import { SpinnerService } from '../../core/services/spinner.service';
import { Account } from 'src/app/core/model/account';
import { Store } from '@ngxs/store';
import { AccountActions, AccountState } from 'src/app/core/store/account.state';
import { UserService } from 'src/app/core/services/user.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgIf, AsyncPipe, NgFor, Location } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, PRIMARY_OUTLET, Router, RouteReuseStrategy, RouterLink, RouterLinkActive, RouterOutlet, UrlSegment } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AccountService } from 'src/app/core/services/account.service';
import { FlexLayoutModule, FlexModule } from 'ngx-flexible-layout';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.css'],
    standalone: true,
    imports: [
        MatToolbarModule, 
        MatButtonModule, 
        MatIconModule, 
        MatTooltipModule, 
        RouterLink, 
        MatMenuModule, 
        MatBadgeModule, 
        MatSidenavModule, 
        MatListModule, 
        RouterLinkActive, 
        MatDividerModule, 
        NgIf, 
        MatProgressBarModule, 
        RouterOutlet, 
        NgFor, 
        AsyncPipe,
        FlexLayoutModule,
    ]
})
export class LayoutComponent implements OnInit, OnDestroy, AfterViewInit {

    private _mobileQueryListener: () => void;
    mobileQuery: MediaQueryList;
    showSpinner: boolean = false;
    displayUserName$: Observable<string | null>;
    isAdmin: boolean = false;
    selectedAccount: Account;
    accounts$: Observable<Account[]>;

    private autoLogoutSubscription: Subscription = new Subscription;


    constructor(private changeDetectorRef: ChangeDetectorRef,
        private media: MediaMatcher,
        public spinnerService: SpinnerService,
        private store: Store,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private accountService: AccountService,
        private location: Location,
        private authService: AuthenticationService) {
        this.displayUserName$ = authService.displayName$;
        this.mobileQuery = this.media.matchMedia('(max-width: 1000px)');
        this._mobileQueryListener = () => changeDetectorRef.detectChanges();
        // tslint:disable-next-line: deprecation
        this.mobileQuery.addListener(this._mobileQueryListener);
    }

    ngOnInit(): void {
        this.selectedAccount = this.store.selectSnapshot(AccountState.selectedAccount);
        this.authService.user$.subscribe((user) => {
            if (user && user.uid) {
                this.accounts$ = this.accountService.getAccounts(user.uid);
            }
        });
    }

    ngOnDestroy(): void {
        // tslint:disable-next-line: deprecation
        this.mobileQuery.removeListener(this._mobileQueryListener);
        this.autoLogoutSubscription.unsubscribe();
    }

    ngAfterViewInit(): void {
        this.changeDetectorRef.detectChanges();
    }

    onChangeAccount(selectedAccount: Account) {
        this.store.dispatch(new AccountActions.selectAccount(selectedAccount));

        const currentAccountId = this.selectedAccount.id;
        if (currentAccountId && selectedAccount.id) {
            const newUrl = this.router.url.toString().replace(currentAccountId, selectedAccount.id);
            this.router.navigate([newUrl]);
        }


    }

    onLogout() {
        this.authService.logout();
    }
}
