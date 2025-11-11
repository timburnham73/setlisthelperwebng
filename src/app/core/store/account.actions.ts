import { Account } from '../model/account';
import { AccountUser } from '../model/AccountUser';
import { User } from '../model/user';

export namespace AccountActions {
  export class LoadAccounts {
    public static readonly type = '[Accounts] Load Accounts';
    constructor(public userId: string) {}
  }

  export class GetAccount {
    public static readonly type = '[Accounts] Get Account';
    constructor(public accountId: string) {}
  }

  export class AddAccount {
    public static readonly type = '[Accounts] Add Account';
    constructor(
      public account: Account,
      public userAddingTheAccount: any,
      public userToAdd: AccountUser
    ) {}
  }

  export class UpdateAccount {
    public static readonly type = '[Accounts] Update Account';
    constructor(public id: string, public user: any, public data: Account) {}
  }

  export class GetAccountUsers {
    public static readonly type = '[Accounts] Get Account Users';
    constructor(public accountId: string) {}
  }

  export class AddUserToAccount {
    public static readonly type = '[Accounts] Add User To Account';
    constructor(
      public account: Account,
      public userUpdatingAccount: any,
      public user: AccountUser
    ) {}
  }

  export class UpdateAccountUserRole {
    public static readonly type = '[Accounts] Update Account User Role';
    constructor(public account: Account, public user: AccountUser) {}
  }

  export class RemoveUserFromAccount {
    public static readonly type = '[Accounts] Remove User From Account';
    constructor(public account: Account, public user: User) {}
  }

  export class selectAccount {
    public static readonly type = '[Account Result] Select Account';
    constructor(public selectedAccount: Account) {}
  }
}
