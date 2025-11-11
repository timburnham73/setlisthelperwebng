import {
  State,
  Selector,
  Action,
  StateContext,
} from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';

import { from, map, Observable, switchMap, take, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Account, AccountHelper } from '../model/account';
import { AccountUser, AccountUserHelper } from '../model/AccountUser';
import { User } from '../model/user';
import { AccountActions } from './account.actions';

export interface AccountStateModel {
  accounts: Account[];
  selectedAccount: Account;
  accountUsers: User[];
  loading: boolean;
  error: any;
}

@State<AccountStateModel>({
  name: 'accounts',
  defaults: {
    accounts: [],
    selectedAccount: undefined as any,
    accountUsers: [],
    loading: false,
    error: null,
  },
})
@Injectable()
export class AccountState {
  constructor(private db: AngularFirestore) {}

  @Selector()
  static selectedAccount(state: AccountStateModel): Account {
    return state.selectedAccount || '';
  }
  @Selector()
  static all(state: AccountStateModel): Account[] {
    return state.accounts;
  }
  @Selector()
  static users(state: AccountStateModel): User[] {
    return state.accountUsers;
  }
  @Selector()
  static loading(state: AccountStateModel): boolean {
    return state.loading;
  }
  

  @Action(AccountActions.selectAccount)
  selectAccount(
    { setState }: StateContext<AccountStateModel>,
    {selectedAccount}: AccountActions.selectAccount
  ) {
    
      setState(patch({ selectedAccount }));
    
    
  }

  @Action(AccountActions.LoadAccounts)
  loadAccounts(
    { setState }: StateContext<AccountStateModel>,
    { userId }: AccountActions.LoadAccounts
  ): Observable<Account[]> {
    setState(patch({ loading: true, error: null }));

    const col = this.db.collection<Account>('/accounts', (ref) =>
      ref.where('users', 'array-contains', userId)
    );

    return col
      .get()
      .pipe(
        map((snap) => snap.docs.map((d) => ({ id: d.id, ...(d.data() as Account) }))),
        tap((accounts) => setState(patch({ accounts, loading: false })))
      );
  }

  @Action(AccountActions.GetAccount)
  getAccount(
    { setState }: StateContext<AccountStateModel>,
    { accountId }: AccountActions.GetAccount
  ): Observable<Account> {
    setState(patch({ loading: true, error: null }));
    const docRef = this.db.doc<Account>(`/accounts/${accountId}`);
    return docRef.snapshotChanges().pipe(
      map((snap) => ({ id: accountId, ...(snap.payload.data() as Account) })),
      tap((account) => setState(patch({ selectedAccount: account, loading: false })))
    );
  }

  @Action(AccountActions.AddAccount)
  addAccount(
    { setState }: StateContext<AccountStateModel>,
    { account, userAddingTheAccount, userToAdd }: AccountActions.AddAccount
  ): Observable<Account> {
    const toAdd = AccountHelper.getForAdd(userAddingTheAccount, account);
    const col = this.db.collection<Account>('/accounts');

    return from(col.add(toAdd)).pipe(
      switchMap((res) => {
        const rtn: Account = { id: res.id, ...toAdd } as Account;
        // add owner to subcollection and users array
        const usersCol = col.doc(res.id).collection<AccountUser>('/users');
        const userDoc$ = from(usersCol.add(AccountUserHelper.getForUpdate(userToAdd)));
        const updateUsersArray$ = from(
          col.doc(res.id).update({ users: [...(rtn.users ?? []), userToAdd.uid] })
        );
        return userDoc$.pipe(map(() => rtn), switchMap((acc) => updateUsersArray$.pipe(map(() => acc))));
      }),
      tap((saved) => setState(patch({ accounts: append([saved]) })))
    );
  }

  @Action(AccountActions.UpdateAccount)
  updateAccount(
    { setState, getState }: StateContext<AccountStateModel>,
    { id, user, data }: AccountActions.UpdateAccount
  ): Observable<void> {
    const accountForUpdate = AccountHelper.getForUpdate(user, data);
    const docRef = this.db.doc<Account>(`/accounts/${id}`);
    return from(docRef.update(accountForUpdate)).pipe(
      tap(() =>
        setState(
          patch({
            accounts: updateItem<Account>((a) => a?.id === id, { ...data, id } as Account),
            selectedAccount: (existing) =>
              existing && (existing as Account).id === id ? ({ ...data, id } as Account) : existing,
          })
        )
      )
    );
  }

  @Action(AccountActions.GetAccountUsers)
  getAccountUsers(
    { setState }: StateContext<AccountStateModel>,
    { accountId }: AccountActions.GetAccountUsers
  ): Observable<User[]> {
    setState(patch({ loading: true, error: null }));
    const col = this.db.collection<User>(`/accounts/${accountId}/users`);
    return col.snapshotChanges().pipe(
      map((changes) => changes.map((c) => ({ id: c.payload.doc.id, ...(c.payload.doc.data() as User) }))),
      tap((users) => setState(patch({ accountUsers: users, loading: false })))
    );
  }

  @Action(AccountActions.AddUserToAccount)
  addUserToAccount(
    { setState, getState }: StateContext<AccountStateModel>,
    { account, userUpdatingAccount, user }: AccountActions.AddUserToAccount
  ): Observable<void> {
    const usersCol = this.db.collection<AccountUser>(`/accounts/${account.id}/users`);
    const docRef = this.db.doc<Account>(`/accounts/${account.id}`);
    const userToAdd = AccountUserHelper.getForUpdate(user);

    return from(usersCol.add(userToAdd)).pipe(
      switchMap(() => {
        const updatedUsers = account.users?.includes(user.uid) ? account.users : [...(account.users ?? []), user.uid];
        return from(docRef.update({ users: updatedUsers }));
      }),
      tap(() => setState(patch({})))
    );
  }

  @Action(AccountActions.UpdateAccountUserRole)
  updateAccountUserRole(
    { setState }: StateContext<AccountStateModel>,
    { account, user }: AccountActions.UpdateAccountUserRole
  ): Observable<void> {
    const userDoc = this.db
      .doc(`/accounts/${account.id}`)
      .collection('/users')
      .doc(user.id);
    const userToUpdate = AccountUserHelper.getForUpdate(user);
    return from(userDoc.update(userToUpdate));
  }

  @Action(AccountActions.RemoveUserFromAccount)
  removeUserFromAccount(
    { setState }: StateContext<AccountStateModel>,
    { account, user }: AccountActions.RemoveUserFromAccount
  ): Observable<void> {
    const usersCol = this.db.collection(`/accounts/${account.id}/users`);
    const userDoc = usersCol.doc(user.id);
    const accountDoc = this.db.doc<Account>(`/accounts/${account.id}`);
    return from(userDoc.delete()).pipe(
      switchMap(() => {
        const users = [...(account.users ?? [])];
        const idx = users.indexOf(user.uid);
        if (idx > -1) users.splice(idx, 1);
        return from(accountDoc.update({ users }));
      })
    );
  }

}
