import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import firebase from 'firebase/compat/app';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
  ]
})
export class ContactComponent implements OnDestroy {
  submitting = false;
  submitted = false;
  selectedFile: File | null = null;

  private destroy$ = new Subject<void>();

  contactForm = new FormGroup({
    supportType: new FormControl<string>('', Validators.required),
    platform: new FormControl<string>('', Validators.required),
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', Validators.required),
    appVersion: new FormControl(''),
    deviceInfo: new FormControl(''),
    bandName: new FormControl(''),
    description: new FormControl('', Validators.required),
  });

  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private notificationService: NotificationService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.titleService.setTitle('Contact Support - Band Central');
    this.metaService.updateTag({ name: 'description', content: 'Contact Band Central support for help with purchases, billing, or technical issues.' });

    // Toggle conditional validators based on supportType and platform
    this.contactForm.controls.supportType.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateConditionalValidators());

    this.contactForm.controls.platform.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateConditionalValidators());
  }

  get showDeviceFields(): boolean {
    const supportType = this.contactForm.controls.supportType.value;
    const platform = this.contactForm.controls.platform.value;
    return supportType === 'technical' && (platform === 'ios' || platform === 'android');
  }

  private updateConditionalValidators(): void {
    const appVersion = this.contactForm.controls.appVersion;
    const deviceInfo = this.contactForm.controls.deviceInfo;

    if (this.showDeviceFields) {
      appVersion.setValidators(Validators.required);
      deviceInfo.setValidators(Validators.required);
    } else {
      appVersion.clearValidators();
      deviceInfo.clearValidators();
      appVersion.setValue('');
      deviceInfo.setValue('');
    }
    appVersion.updateValueAndValidity();
    deviceInfo.updateValueAndValidity();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.notificationService.openSnackBar('Please select an image file (PNG, JPG, etc.)');
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.notificationService.openSnackBar('File must be less than 10 MB');
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid) return;

    this.submitting = true;

    try {
      let screenshotUrl: string | null = null;

      if (this.selectedFile) {
        const filePath = `contact-attachments/${Date.now()}_${this.selectedFile.name}`;
        const ref = this.storage.ref(filePath);
        const task = ref.put(this.selectedFile);
        await task;
        screenshotUrl = await ref.getDownloadURL().toPromise();
      }

      const formValue = this.contactForm.value;

      await this.afs.collection('contactRequests').add({
        supportType: formValue.supportType,
        platform: formValue.platform,
        name: formValue.name,
        email: formValue.email,
        subject: formValue.subject,
        appVersion: formValue.appVersion || null,
        deviceInfo: formValue.deviceInfo || null,
        bandName: formValue.bandName || null,
        description: formValue.description,
        screenshotUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
      });

      this.submitted = true;
    } catch (error) {
      console.error('Error submitting contact request:', error);
      this.notificationService.openSnackBar('Failed to submit your request. Please try again.');
    } finally {
      this.submitting = false;
    }
  }

  sendAnother(): void {
    this.submitted = false;
    this.selectedFile = null;
    this.contactForm.reset();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
