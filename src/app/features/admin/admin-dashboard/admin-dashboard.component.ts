import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { NgIf, NgFor, AsyncPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from 'src/app/core/services/user.service';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from 'src/app/core/model/user';
import { Account } from 'src/app/core/model/account';
import { ENTITLEMENT_LIMITS } from 'src/app/core/model/entitlement-limits';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AccountDetail {
    name: string;
    countOfSongs: number;
    countOfSetlists: number;
    entitlementLevel: string;
    accountId: string;
}

export interface AdminUserRow {
    uid: string;
    email: string;
    displayName: string;
    countOfAccounts: number;
    countOfSongs: number;
    countOfSetlists: number;
    entitlementLevel: string;
    dateCreated: Date | null;
    lastLoginDate: Date | null;
    accounts: AccountDetail[];
    isSystemAdmin: boolean;
    welcomeEmailSent?: boolean;
}

@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css'],
    standalone: true,
    imports: [
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatSortModule,
        MatCardModule,
        MatProgressSpinnerModule,
        FlexLayoutModule,
        FormsModule,
        MatSelectModule,
        MatSnackBarModule,
        NgIf,
        NgFor,
        AsyncPipe,
        DatePipe,
    ]
})
export class AdminDashboardComponent implements OnInit {
    displayedColumns: string[] = ['expand', 'email', 'displayName', 'countOfAccounts', 'countOfSongs', 'countOfSetlists', 'entitlementLevel', 'dateCreated', 'lastLoginDate', 'actions'];
    dataSource: AdminUserRow[] = [];
    isLoading = true;
    userCount = 0;
    expandedUid: string | null = null;
    currentAdminUid: string = '';
    entitlementOptions = Object.keys(ENTITLEMENT_LIMITS);

    @ViewChild(MatSort) sort: MatSort;

    constructor(
        private userService: UserService,
        private accountService: AccountService,
        private authService: AuthenticationService,
        private firestore: AngularFirestore,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.authService.user$.subscribe(user => {
            if (user) {
                this.currentAdminUid = user.uid;
            }
        });
        this.loadUsers();
    }

    toggleExpand(row: AdminUserRow): void {
        this.expandedUid = this.expandedUid === row.uid ? null : row.uid;
    }

    private loadUsers(): void {
        this.isLoading = true;
        this.userService.getAllUsers().subscribe(users => {
            this.userCount = users.length;

            const userQueries = users.map(user =>
                this.accountService.getAccounts(user.uid).pipe(
                    map(accounts => {
                        const totalSongs = accounts.reduce((sum, a) => sum + (a.countOfSongs || 0), 0);
                        const totalSetlists = accounts.reduce((sum, a) => sum + (a.countOfSetlists || 0), 0);
                        const entitlement = accounts.length > 0 ? (accounts[0].entitlementLevel || 'free') : 'free';
                        // Use earliest account dateCreated, fall back to user dateCreated or lastLoginDate
                        const accountDates = accounts
                            .filter(a => a.dateCreated)
                            .map(a => a.dateCreated.toDate())
                            .sort((a, b) => a.getTime() - b.getTime());
                        const createdDate = accountDates.length > 0 ? accountDates[0]
                            : (user.dateCreated ? user.dateCreated.toDate() : null);
                        const accountDetails: AccountDetail[] = accounts.map(a => ({
                            name: a.name,
                            countOfSongs: a.countOfSongs || 0,
                            countOfSetlists: a.countOfSetlists || 0,
                            entitlementLevel: a.entitlementLevel || 'free',
                            accountId: a.id || '',
                        }));
                        return {
                            uid: user.uid,
                            email: user.email || '',
                            displayName: user.displayName || '',
                            countOfAccounts: accounts.length,
                            countOfSongs: totalSongs,
                            countOfSetlists: totalSetlists,
                            entitlementLevel: entitlement,
                            dateCreated: createdDate,
                            lastLoginDate: user.lastLoginDate ? user.lastLoginDate.toDate() : null,
                            accounts: accountDetails,
                            isSystemAdmin: user.systemAdmin === true,
                        } as AdminUserRow;
                    }),
                    catchError(() => of({
                        uid: user.uid,
                        email: user.email || '',
                        displayName: user.displayName || '',
                        countOfAccounts: 0,
                        countOfSongs: 0,
                        countOfSetlists: 0,
                        entitlementLevel: 'free',
                        dateCreated: user.dateCreated ? user.dateCreated.toDate() : null,
                        lastLoginDate: user.lastLoginDate ? user.lastLoginDate.toDate() : null,
                        accounts: [],
                        isSystemAdmin: user.systemAdmin === true,
                    } as AdminUserRow))
                )
            );

            forkJoin(userQueries).subscribe(rows => {
                this.dataSource = rows;
                this.isLoading = false;
            });
        });
    }

    addAdminToAccount(row: AdminUserRow, account: AccountDetail): void {
        this.accountService.getAccount(account.accountId).subscribe(fullAccount => {
            // Add admin uid to the account's users array
            if (!fullAccount.users?.includes(this.currentAdminUid)) {
                fullAccount.users = fullAccount.users || [];
                fullAccount.users.push(this.currentAdminUid);
                this.accountService.updateAccountDirect(account.accountId, { users: fullAccount.users });

                // Add admin to account's users subcollection
                this.userService.getUserById(this.currentAdminUid).subscribe(adminUser => {
                    if (adminUser) {
                        const accountUserRef = this.accountService.getAccountUsersRef(account.accountId);
                        accountUserRef.add({
                            uid: adminUser.uid,
                            displayName: adminUser.displayName,
                            email: adminUser.email,
                            role: 'Admin',
                            systemAdmin: true,
                        });
                    }
                });
            }
        });
    }

    removeAdminFromAccount(row: AdminUserRow, account: AccountDetail): void {
        this.accountService.getAccount(account.accountId).subscribe(fullAccount => {
            // Remove admin uid from the account's users array
            const idx = fullAccount.users?.indexOf(this.currentAdminUid);
            if (idx !== undefined && idx > -1) {
                fullAccount.users?.splice(idx, 1);
                this.accountService.updateAccountDirect(account.accountId, { users: fullAccount.users });
            }

            // Remove admin from account's users subcollection
            const accountUserRef = this.accountService.getAccountUsersRef(account.accountId);
            accountUserRef.ref.where('uid', '==', this.currentAdminUid).get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
        });
    }

    onChangeUserEntitlement(row: AdminUserRow, newLevel: string): void {
        // Update user's entitlement
        this.userService.updateUserEntitlement(row.uid, newLevel);
        row.entitlementLevel = newLevel;

        // Update all their accounts too
        for (const account of row.accounts) {
            this.accountService.updateAccountDirect(account.accountId, { entitlementLevel: newLevel });
            account.entitlementLevel = newLevel;
        }
    }

    onChangeEntitlement(account: AccountDetail, newLevel: string): void {
        this.accountService.updateAccountDirect(account.accountId, { entitlementLevel: newLevel });
        account.entitlementLevel = newLevel;
    }

    sendWelcomeEmail(row: AdminUserRow): void {
        if (!row.email) {
            this.snackBar.open('No email address for this user', 'OK', { duration: 3000 });
            return;
        }

        this.firestore.collection('welcomeEmails').add({
            email: row.email,
            displayName: row.displayName || '',
            status: 'pending',
            createdAt: new Date(),
            uid: row.uid,
        }).then(() => {
            row.welcomeEmailSent = true;
            this.snackBar.open(`Welcome email sent to ${row.email}`, 'OK', { duration: 3000 });
        }).catch(error => {
            console.error('Error queuing welcome email:', error);
            this.snackBar.open('Failed to send welcome email', 'OK', { duration: 3000 });
        });
    }

    sortData(sort: Sort): void {
        const data = [...this.dataSource];
        if (!sort.active || sort.direction === '') {
            this.dataSource = data;
            return;
        }

        this.dataSource = data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'email': return compare(a.email, b.email, isAsc);
                case 'displayName': return compare(a.displayName, b.displayName, isAsc);
                case 'countOfAccounts': return compare(a.countOfAccounts, b.countOfAccounts, isAsc);
                case 'countOfSongs': return compare(a.countOfSongs, b.countOfSongs, isAsc);
                case 'countOfSetlists': return compare(a.countOfSetlists, b.countOfSetlists, isAsc);
                case 'entitlementLevel': return compare(a.entitlementLevel, b.entitlementLevel, isAsc);
                case 'dateCreated': return compare(a.dateCreated?.getTime() || 0, b.dateCreated?.getTime() || 0, isAsc);
                case 'lastLoginDate': return compare(a.lastLoginDate?.getTime() || 0, b.lastLoginDate?.getTime() || 0, isAsc);
                default: return 0;
            }
        });
    }
}

function compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
