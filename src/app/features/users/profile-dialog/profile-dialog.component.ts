import { AsyncPipe, DatePipe, NgIf } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { firstValueFrom, Observable, of } from "rxjs";
import { catchError, map, switchMap, take } from "rxjs/operators";
import { AuthenticationService } from "src/app/core/services/auth.service";
import { NotificationService } from "src/app/core/services/notification.service";
import { UserService } from "src/app/core/services/user.service";
import { User } from "src/app/core/model/user";
import { nonWhitespaceValidator } from "src/app/shared/validators/non-whitespace.validator";

const ENTITLEMENT_LABELS: Record<string, string> = {
  free: "Free",
  solo: "Solo",
  "solo-free-trial": "Solo (free trial)",
  "band-small": "Band Small",
  "band-small-free-trial": "Band Small (free trial)",
  "band-medium": "Band Medium",
  "band-medium-free-trial": "Band Medium (free trial)",
  "band-large": "Band Large",
  "band-large-free-trial": "Band Large (free trial)",
  "band-extra-large": "Band Extra Large",
  "band-extra-large-free-trial": "Band Extra Large (free trial)",
};

const PROVIDER_LABELS: Record<string, string> = {
  password: "Email & password",
  "google.com": "Google",
  "apple.com": "Apple",
  "facebook.com": "Facebook",
  "microsoft.com": "Microsoft",
};

@Component({
  selector: "app-profile-dialog",
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
  ],
  templateUrl: "./profile-dialog.component.html",
  styleUrls: ["./profile-dialog.component.scss"],
})
export class ProfileDialogComponent implements OnInit {
  saving = false;
  sendingReset = false;
  linking = false;

  email = "";
  entitlementLabel = "";
  memberSince: Date | null = null;
  signInMethodsLabel = "";
  hasPasswordProvider = false;
  showSetPasswordForm = false;

  uid: string | null = null;
  private currentUser: User | null = null;

  profileForm = new FormGroup({
    displayName: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(50),
        nonWhitespaceValidator,
      ],
    }),
  });

  setPasswordForm = new FormGroup(
    {
      newPassword: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatch }
  );

  constructor(
    public dialogRef: MatDialogRef<ProfileDialogComponent>,
    private authService: AuthenticationService,
    private userService: UserService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(take(1)).subscribe((authUser) => {
      if (!authUser || !authUser.uid) {
        this.dialogRef.close();
        return;
      }
      this.uid = authUser.uid;
      this.email = authUser.email ?? "";

      const providerIds: string[] = (authUser.providerData ?? [])
        .map((p: any) => p?.providerId)
        .filter((id: any): id is string => !!id);
      this.hasPasswordProvider = providerIds.includes("password");
      this.signInMethodsLabel = providerIds.length
        ? providerIds.map((id) => PROVIDER_LABELS[id] ?? id).join(", ")
        : "Unknown";

      this.userService.getUserById(authUser.uid).pipe(take(1)).subscribe((firestoreUser) => {
        this.currentUser = firestoreUser ?? null;
        const displayName = firestoreUser?.displayName ?? authUser.displayName ?? "";
        this.profileForm.controls.displayName.setValue(displayName);
        this.entitlementLabel = labelForEntitlement(firestoreUser?.entitlementLevel);
        const created = firestoreUser?.dateCreated as any;
        if (created?.toDate) {
          this.memberSince = created.toDate();
        }
      });
    });
  }

  async onSave(): Promise<void> {
    if (this.profileForm.invalid || !this.currentUser || !this.uid) {
      return;
    }
    const newDisplayName = this.profileForm.controls.displayName.value.trim();
    this.saving = true;
    try {
      await this.authService.updateAuthDisplayName(newDisplayName);
      await firstValueFrom(
        this.userService.updateUser(this.uid, {
          ...this.currentUser,
          displayName: newDisplayName,
        })
      );
      this.notification.openSnackBar("Profile updated.");
      this.dialogRef.close({ displayName: newDisplayName });
    } catch (err: any) {
      console.error("Profile update failed", err);
      this.notification.openSnackBar(`Could not update profile: ${err?.message ?? "unknown error"}`);
      this.saving = false;
    }
  }

  async onSendPasswordReset(): Promise<void> {
    this.sendingReset = true;
    try {
      await this.authService.sendPasswordReset();
      this.notification.openSnackBar("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      console.error("Password reset failed", err);
      this.notification.openSnackBar(`Could not send reset email: ${err?.message ?? "unknown error"}`);
    } finally {
      this.sendingReset = false;
    }
  }

  toggleSetPasswordForm(): void {
    this.showSetPasswordForm = !this.showSetPasswordForm;
    if (!this.showSetPasswordForm) {
      this.setPasswordForm.reset();
    }
  }

  async onSetPassword(): Promise<void> {
    if (this.setPasswordForm.invalid) {
      return;
    }
    const newPassword = this.setPasswordForm.controls.newPassword.value;
    this.linking = true;
    try {
      await this.authService.linkPassword(newPassword);
      this.notification.openSnackBar("Password set. You can now sign in with email & password.");
      this.hasPasswordProvider = true;
      this.signInMethodsLabel = this.signInMethodsLabel + ", Email & password";
      this.showSetPasswordForm = false;
      this.setPasswordForm.reset();
    } catch (err: any) {
      console.error("Set password failed", err);
      const message = err?.code === "auth/popup-closed-by-user"
        ? "Re-authentication was cancelled."
        : err?.message ?? "unknown error";
      this.notification.openSnackBar(`Could not set password: ${message}`);
    } finally {
      this.linking = false;
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

function passwordsMatch(group: import("@angular/forms").AbstractControl): import("@angular/forms").ValidationErrors | null {
  const newPw = group.get("newPassword")?.value;
  const confirm = group.get("confirmPassword")?.value;
  return newPw && confirm && newPw !== confirm ? { mismatch: true } : null;
}

function labelForEntitlement(value: string | undefined): string {
  if (!value) return "Free";
  return ENTITLEMENT_LABELS[value] ?? value;
}
