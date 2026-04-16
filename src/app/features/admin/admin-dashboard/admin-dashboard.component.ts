import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { NgIf, NgFor, AsyncPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
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

// --- Bands Tab Interfaces ---
export interface BandMember {
    displayName: string;
    email: string;
    uid: string;
    role: string;
    isOwner: boolean;
}

export interface AdminBandRow {
    accountId: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
    countOfSongs: number;
    countOfSetlists: number;
    memberCount: number;
    entitlementLevel: string;
    isPurchased: boolean;
    dateCreated: Date | null;
    members: BandMember[];
}

function isPaidEntitlement(level: string): boolean {
    return level !== 'free' && !level.endsWith('-free-trial');
}

// --- Users Tab Interfaces ---
export interface AccountDetail {
    name: string;
    countOfSongs: number;
    countOfSetlists: number;
    memberCount: number;
    entitlementLevel: string;
    accountId: string;
}

export interface AdminUserRow {
    uid: string;
    email: string;
    displayName: string;
    countOfAccounts: number;
    entitlementLevel: string;
    isPurchased: boolean;
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
        MatTabsModule,
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
    // Bands tab
    bandDisplayedColumns: string[] = ['expand', 'name', 'ownerName', 'countOfSongs', 'countOfSetlists', 'memberCount', 'entitlementLevel', 'isPurchased', 'dateCreated', 'actions'];
    bandDataSource: AdminBandRow[] = [];
    isLoadingBands = true;
    bandCount = 0;
    expandedBandId: string | null = null;

    // Users tab
    userDisplayedColumns: string[] = ['expand', 'email', 'displayName', 'countOfAccounts', 'entitlementLevel', 'isPurchased', 'dateCreated', 'lastLoginDate', 'actions'];
    userDataSource: AdminUserRow[] = [];
    isLoadingUsers = true;
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
        this.loadBands();
    }

    onTabChange(event: any): void {
        if (event.index === 0 && this.bandDataSource.length === 0) {
            this.loadBands();
        } else if (event.index === 1 && this.userDataSource.length === 0) {
            this.loadUsers();
        }
    }

    // ==================== BANDS TAB ====================

    toggleBandExpand(row: AdminBandRow): void {
        if (this.expandedBandId === row.accountId) {
            this.expandedBandId = null;
        } else {
            this.expandedBandId = row.accountId;
            // Lazy load members if not loaded yet
            if (!row.members || row.members.length === 0) {
                this.accountService.getAccountUsers(row.accountId).subscribe(users => {
                    row.members = users.map(u => ({
                        displayName: (u as any).displayName || '',
                        email: (u as any).email || '',
                        uid: (u as any).uid || '',
                        role: (u as any).role || 'Member',
                        isOwner: (u as any).isOwner === true,
                    }));
                    row.memberCount = row.members.length;
                });
            }
        }
    }

    private loadBands(): void {
        this.isLoadingBands = true;
        this.accountService.getAllAccounts().subscribe(accounts => {
            this.bandCount = accounts.length;
            this.bandDataSource = accounts.map(a => ({
                accountId: a.id || '',
                name: a.name || '',
                ownerName: a.ownerUser?.displayName || '',
                ownerEmail: a.ownerUser?.email || '',
                countOfSongs: a.countOfSongs || 0,
                countOfSetlists: a.countOfSetlists || 0,
                memberCount: a.users?.length || 0,
                entitlementLevel: a.entitlementLevel || 'free',
                isPurchased: isPaidEntitlement(a.entitlementLevel || 'free'),
                dateCreated: this.toDateSafe(a.dateCreated),
                members: [],
            }));
            this.isLoadingBands = false;
        });
    }

    onChangeBandEntitlement(row: AdminBandRow, newLevel: string): void {
        this.accountService.updateAccountDirect(row.accountId, { entitlementLevel: newLevel });
        row.entitlementLevel = newLevel;
        row.isPurchased = isPaidEntitlement(newLevel);
    }

    addAdminToBand(row: AdminBandRow): void {
        this.accountService.getAccount(row.accountId).subscribe(fullAccount => {
            if (!fullAccount.users?.includes(this.currentAdminUid)) {
                fullAccount.users = fullAccount.users || [];
                fullAccount.users.push(this.currentAdminUid);
                this.accountService.updateAccountDirect(row.accountId, { users: fullAccount.users });

                this.userService.getUserById(this.currentAdminUid).subscribe(adminUser => {
                    if (adminUser) {
                        const accountUserRef = this.accountService.getAccountUsersRef(row.accountId);
                        accountUserRef.add({
                            uid: adminUser.uid,
                            displayName: adminUser.displayName,
                            email: adminUser.email,
                            role: 'Admin',
                            systemAdmin: true,
                        });
                        this.snackBar.open(`Added to ${row.name}`, 'OK', { duration: 3000 });
                    }
                });
            } else {
                this.snackBar.open('Already a member of this band', 'OK', { duration: 3000 });
            }
        });
    }

    removeAdminFromBand(row: AdminBandRow): void {
        this.accountService.getAccount(row.accountId).subscribe(fullAccount => {
            const idx = fullAccount.users?.indexOf(this.currentAdminUid);
            if (idx !== undefined && idx > -1) {
                fullAccount.users?.splice(idx, 1);
                this.accountService.updateAccountDirect(row.accountId, { users: fullAccount.users });
            }
            const accountUserRef = this.accountService.getAccountUsersRef(row.accountId);
            accountUserRef.ref.where('uid', '==', this.currentAdminUid).get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
            this.snackBar.open(`Removed from ${row.name}`, 'OK', { duration: 3000 });
        });
    }

    sortBandData(sort: Sort): void {
        const data = [...this.bandDataSource];
        if (!sort.active || sort.direction === '') {
            this.bandDataSource = data;
            return;
        }
        this.bandDataSource = data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'name': return compare(a.name, b.name, isAsc);
                case 'ownerName': return compare(a.ownerName, b.ownerName, isAsc);
                case 'countOfSongs': return compare(a.countOfSongs, b.countOfSongs, isAsc);
                case 'countOfSetlists': return compare(a.countOfSetlists, b.countOfSetlists, isAsc);
                case 'memberCount': return compare(a.memberCount, b.memberCount, isAsc);
                case 'entitlementLevel': return compare(a.entitlementLevel, b.entitlementLevel, isAsc);
                case 'isPurchased': return compare(a.isPurchased ? 1 : 0, b.isPurchased ? 1 : 0, isAsc);
                case 'dateCreated': return compare(a.dateCreated?.getTime() || 0, b.dateCreated?.getTime() || 0, isAsc);
                default: return 0;
            }
        });
    }

    // ==================== USERS TAB ====================

    toggleUserExpand(row: AdminUserRow): void {
        this.expandedUid = this.expandedUid === row.uid ? null : row.uid;
    }

    private loadUsers(): void {
        this.isLoadingUsers = true;
        this.userService.getAllUsers().subscribe(users => {
            this.userCount = users.length;

            const userQueries = users.map(user =>
                this.accountService.getAccounts(user.uid).pipe(
                    map(accounts => {
                        const accountDates = accounts
                            .map(a => this.toDateSafe(a.dateCreated))
                            .filter((d): d is Date => d !== null)
                            .sort((a, b) => a.getTime() - b.getTime());
                        const createdDate = accountDates.length > 0 ? accountDates[0]
                            : this.toDateSafe(user.dateCreated);
                        const accountDetails: AccountDetail[] = accounts.map(a => ({
                            name: a.name,
                            countOfSongs: a.countOfSongs || 0,
                            countOfSetlists: a.countOfSetlists || 0,
                            memberCount: a.users?.length || 0,
                            entitlementLevel: a.entitlementLevel || 'free',
                            accountId: a.id || '',
                        }));
                        return {
                            uid: user.uid,
                            email: user.email || '',
                            displayName: user.displayName || '',
                            countOfAccounts: accounts.length,
                            entitlementLevel: user.entitlementLevel || 'free',
                            isPurchased: isPaidEntitlement(user.entitlementLevel || 'free'),
                            dateCreated: createdDate,
                            lastLoginDate: this.toDateSafe(user.lastLoginDate),
                            accounts: accountDetails,
                            isSystemAdmin: user.systemAdmin === true,
                        } as AdminUserRow;
                    }),
                    catchError(() => of({
                        uid: user.uid,
                        email: user.email || '',
                        displayName: user.displayName || '',
                        countOfAccounts: 0,
                        entitlementLevel: user.entitlementLevel || 'free',
                        isPurchased: isPaidEntitlement(user.entitlementLevel || 'free'),
                        dateCreated: this.toDateSafe(user.dateCreated),
                        lastLoginDate: this.toDateSafe(user.lastLoginDate),
                        accounts: [],
                        isSystemAdmin: user.systemAdmin === true,
                    } as AdminUserRow))
                )
            );

            forkJoin(userQueries).subscribe(rows => {
                this.userDataSource = rows;
                this.isLoadingUsers = false;
            });
        });
    }

    onChangeUserEntitlement(row: AdminUserRow, newLevel: string): void {
        this.userService.updateUserEntitlement(row.uid, newLevel);
        row.entitlementLevel = newLevel;
        row.isPurchased = isPaidEntitlement(newLevel);
    }

    addAdminToAccount(row: AdminUserRow, account: AccountDetail): void {
        this.accountService.getAccount(account.accountId).subscribe(fullAccount => {
            if (!fullAccount.users?.includes(this.currentAdminUid)) {
                fullAccount.users = fullAccount.users || [];
                fullAccount.users.push(this.currentAdminUid);
                this.accountService.updateAccountDirect(account.accountId, { users: fullAccount.users });

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
            const idx = fullAccount.users?.indexOf(this.currentAdminUid);
            if (idx !== undefined && idx > -1) {
                fullAccount.users?.splice(idx, 1);
                this.accountService.updateAccountDirect(account.accountId, { users: fullAccount.users });
            }
            const accountUserRef = this.accountService.getAccountUsersRef(account.accountId);
            accountUserRef.ref.where('uid', '==', this.currentAdminUid).get().then(snapshot => {
                snapshot.forEach(doc => doc.ref.delete());
            });
        });
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

    sortUserData(sort: Sort): void {
        const data = [...this.userDataSource];
        if (!sort.active || sort.direction === '') {
            this.userDataSource = data;
            return;
        }

        this.userDataSource = data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'email': return compare(a.email, b.email, isAsc);
                case 'displayName': return compare(a.displayName, b.displayName, isAsc);
                case 'countOfAccounts': return compare(a.countOfAccounts, b.countOfAccounts, isAsc);
                case 'entitlementLevel': return compare(a.entitlementLevel, b.entitlementLevel, isAsc);
                case 'isPurchased': return compare(a.isPurchased ? 1 : 0, b.isPurchased ? 1 : 0, isAsc);
                case 'dateCreated': return compare(a.dateCreated?.getTime() || 0, b.dateCreated?.getTime() || 0, isAsc);
                case 'lastLoginDate': return compare(a.lastLoginDate?.getTime() || 0, b.lastLoginDate?.getTime() || 0, isAsc);
                default: return 0;
            }
        });
    }

    private toDateSafe(value: any): Date | null {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value.toDate === 'function') return value.toDate();
        if (typeof value === 'number' || typeof value === 'string') {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
        return null;
    }
}

function compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
