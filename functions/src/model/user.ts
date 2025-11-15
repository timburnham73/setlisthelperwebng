export interface BaseUser {
  uid: string; //This is the user ID that comes from the firebase auth.
  displayName: string;
  email: string;
  photoUrl?: string;
  formatSettings?: any;
  lastLoginDate?: any;
}

export interface User extends BaseUser {
  id?: string; //This is the id/key of the document
}

export class UserHelper {
  static getForUpdate(data: User): BaseUser {
    const baseUser: BaseUser = { 
      uid: data.uid ?? "", 
      displayName: data.displayName ?? "", 
      email: data.email ?? "",
      photoUrl: data.photoUrl ?? undefined,
      formatSettings: data.formatSettings ?? undefined,
      lastLoginDate: data.lastLoginDate ?? undefined
    };
    if (baseUser.photoUrl === undefined) {
      delete baseUser.photoUrl;
    }
    if (baseUser.formatSettings === undefined) {
      delete (baseUser as any).formatSettings;
    }
    if (baseUser.lastLoginDate === undefined) {
      delete (baseUser as any).lastLoginDate;
    }
    return baseUser;
  }
  
}
