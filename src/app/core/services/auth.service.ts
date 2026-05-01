import { Injectable, Inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { delay, map, switchMap } from "rxjs/operators";
import * as jwt_decode from "jwt-decode";
import * as moment from "moment";

import { environment } from "../../../environments/environment";
import { of, EMPTY, Observable, BehaviorSubject, from } from "rxjs";
import { UserRoles } from "../model/user-roles";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Router } from "@angular/router";
import firebase from "firebase/compat/app";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  isLoggedIn$: Observable<boolean>;

  isLoggedOut$: Observable<boolean>;

  pictureUrl$: Observable<string | null>;

  roles$: Observable<UserRoles>;

  displayName$: Observable<string | null>;

  /** providerIds (e.g. 'password', 'google.com', 'apple.com') for the current user. */
  signInProviders$: Observable<string[]>;

  user$: Observable<any | null>;

  // Local override so display-name edits propagate to the toolbar without
  // waiting for an authState event (Firebase Auth's updateProfile doesn't
  // re-emit on authState).
  private displayNameOverride$ = new BehaviorSubject<string | null>(null);

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private db: AngularFirestore
  ) {
    this.isLoggedIn$ = afAuth.authState.pipe(map((user) => !!user));

    this.isLoggedOut$ = this.isLoggedIn$.pipe(map((loggedIn) => !loggedIn));

    this.displayName$ = afAuth.authState.pipe(
      switchMap((user) =>
        this.displayNameOverride$.pipe(
          map((override) => override ?? (user ? user.displayName : ""))
        )
      )
    );

    this.user$ = afAuth.authState.pipe(map((user) => (user ? user : "")));

    this.pictureUrl$ = afAuth.authState.pipe(
      map((user) => (user ? user.photoURL : null))
    );

    this.signInProviders$ = afAuth.authState.pipe(
      map((user) => (user ? user.providerData.map((p) => p?.providerId).filter((id): id is string => !!id) : []))
    );

    this.roles$ = this.afAuth.idTokenResult.pipe(
      map((token) => <any>token?.claims ?? { admin: false })
    );

    // Reset the override whenever the user changes (sign in / sign out).
    afAuth.authState.subscribe(() => this.displayNameOverride$.next(null));
  }

  logout() {
    this.afAuth.signOut();
    this.router.navigateByUrl("/auth/login");
  }

  /**
   * Update the Firebase Auth profile's displayName and push the new value
   * into the local override so subscribers (toolbar) refresh immediately.
   * Returns a promise that resolves once the auth profile is updated.
   */
  async updateAuthDisplayName(displayName: string): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user) {
      throw new Error("Not signed in");
    }
    await user.updateProfile({ displayName });
    this.displayNameOverride$.next(displayName);
  }

  /** Send a password reset email to the currently signed-in user's email. */
  async sendPasswordReset(): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user || !user.email) {
      throw new Error("No email on file for current user");
    }
    if (!user.providerData.some((p) => p?.providerId === "password")) {
      // Defense in depth — UI hides the button for OAuth-only accounts.
      throw new Error("This account doesn't use a password");
    }
    await this.afAuth.sendPasswordResetEmail(user.email);
  }

  /**
   * Link a password credential to an OAuth-only account so the user can
   * sign in with email + password going forward. Re-auths with their
   * existing provider if Firebase requires recent login.
   */
  async linkPassword(password: string): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (!user || !user.email) {
      throw new Error("No email on file for current user");
    }
    if (user.providerData.some((p) => p?.providerId === "password")) {
      throw new Error("Password is already set for this account");
    }
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    try {
      await user.linkWithCredential(credential);
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        await this.reauthenticateExistingProvider(user);
        await user.linkWithCredential(credential);
      } else {
        throw err;
      }
    }
  }

  private async reauthenticateExistingProvider(user: firebase.User): Promise<void> {
    const providerId = user.providerData[0]?.providerId;
    let provider: firebase.auth.AuthProvider;
    switch (providerId) {
      case "google.com":
        provider = new firebase.auth.GoogleAuthProvider();
        break;
      case "apple.com":
        provider = new firebase.auth.OAuthProvider("apple.com");
        break;
      case "facebook.com":
        provider = new firebase.auth.FacebookAuthProvider();
        break;
      default:
        throw new Error("Please sign out and sign in again to continue.");
    }
    await user.reauthenticateWithPopup(provider);
  }
}
