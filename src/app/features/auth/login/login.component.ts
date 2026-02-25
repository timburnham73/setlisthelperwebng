import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/core/services/notification.service';
import firebase from 'firebase/compat/app';
import * as firebaseui from 'firebaseui'
import { AngularFireAuth } from '@angular/fire/compat/auth';
import EmailAuthProvider = firebase.auth.EmailAuthProvider;
import GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
import { UserService } from 'src/app/core/services/user.service';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: true,
    imports: [NgIf, RouterLink],
})
export class LoginComponent implements OnInit, OnDestroy {
    ui: firebaseui.auth.AuthUI | null = null;
    showEmailSignIn = false;

    constructor(private router: Router,
        private titleService: Title,
        private notificationService: NotificationService,
        private afAuth: AngularFireAuth,
        private userService: UserService) {
    }

    ngOnInit() {
        this.titleService.setTitle('Band Central - Login');
    }

    ngOnDestroy() {
        if (this.ui) {
            this.ui.delete();
        }
    }

    onGoogleSignIn() {
        const provider = new GoogleAuthProvider();
        this.afAuth.signInWithPopup(provider).then((result) => {
            if (result.user) {
                this.userService.setUser(result.user).subscribe();
                this.router.navigateByUrl("/accounts");
            }
        }).catch(() => {
            // COOP policy can cause a false error even when sign-in succeeds.
            // Check if the user is actually signed in before showing an error.
            this.afAuth.currentUser.then(user => {
                if (user) {
                    this.userService.setUser(user).subscribe();
                    this.router.navigateByUrl("/accounts");
                } else {
                    this.notificationService.openSnackBar('Google sign-in failed. Please try again.');
                }
            });
        });
    }

    onEmailSignIn(event: Event) {
        event.preventDefault();
        this.showEmailSignIn = true;

        setTimeout(() => {
            this.afAuth.app.then(app => {
                const uiConfig = {
                    signInOptions: [EmailAuthProvider.PROVIDER_ID],
                    signInFlow: 'popup',
                    callbacks: {
                        signInSuccessWithAuthResult: (authResult: any) => {
                            this.onLoginSuccessful(authResult);
                            return false;
                        },
                    }
                };

                this.ui = new firebaseui.auth.AuthUI(app.auth());
                this.ui.start("#login-container", uiConfig);
                this.ui.disableAutoSignIn();
            });
        });
    }

    onBackToButtons() {
        this.showEmailSignIn = false;
        if (this.ui) {
            this.ui.delete();
            this.ui = null;
        }
    }

    onLoginSuccessful(authResult: any) {
        this.userService.setUser(authResult.user).subscribe();
        this.router.navigateByUrl("/accounts");
    }
}
