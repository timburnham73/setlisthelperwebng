import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import {
  BrowserModule,
  provideClientHydration,
} from "@angular/platform-browser";
import {
  BrowserAnimationsModule,
  provideAnimations,
} from "@angular/platform-browser/animations";

import { environment } from "../environments/environment";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatCardModule } from "@angular/material/card";

import { AngularFireModule } from "@angular/fire/compat";
import {
  AngularFireAnalyticsModule,
  APP_NAME,
  APP_VERSION,
  DEBUG_MODE as ANALYTICS_DEBUG_MODE,
  COLLECTION_ENABLED,
} from "@angular/fire/compat/analytics";
import {
  AngularFirestoreModule,
  USE_EMULATOR as USE_FIRESTORE_EMULATOR,
  SETTINGS as FIRESTORE_SETTINGS,
} from "@angular/fire/compat/firestore";
import {
  AngularFireAuthModule,
  USE_DEVICE_LANGUAGE,
  USE_EMULATOR as USE_AUTH_EMULATOR,
} from "@angular/fire/compat/auth";
import {
  AngularFireFunctionsModule,
  USE_EMULATOR as USE_FUNCTIONS_EMULATOR,
} from "@angular/fire/compat/functions";
import {
  AngularFireStorageModule,
  USE_EMULATOR as USE_STORAGE_EMULATOR,
} from "@angular/fire/compat/storage";
import { AngularFireAuthGuardModule } from "@angular/fire/compat/auth-guard";

import { NgxsModule, provideStates } from "@ngxs/store";
import { AccountStateModule } from "./core/store/account-state.module";
import { SongState } from "./core/store/song.state";
import { ArtistState } from "./core/store/artist.state";
import { GenreState } from "./core/store/genre.state";
import { AppRoutingModule } from "./app-routing.module";
import { CustomMaterialModule } from "./custom-material/custom-material.module";
import { SharedModule } from "./shared/shared.module";
import { CoreModule } from "./core/core.module";

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFirestoreModule,
      AngularFireAuthModule,
      AngularFireAuthGuardModule,
      AngularFireAnalyticsModule,
      AngularFireFunctionsModule,
      AngularFireStorageModule,
      BrowserModule,
      BrowserAnimationsModule,
      CoreModule,
      SharedModule,
      CustomMaterialModule.forRoot(),
      AppRoutingModule,
      NgxsModule.forRoot([], {
        selectorOptions: {
          injectContainerState: false,
        },
      }),
      AccountStateModule,
      MatCardModule,
      MatDividerModule,
      MatButtonModule,
      MatProgressBarModule,
    ),
    provideStates([SongState, ArtistState, GenreState]),
    provideAnimations(),
    provideClientHydration(),
    { provide: FIRESTORE_SETTINGS, useValue: { ignoreUndefinedProperties: true, merge: true } },
    { provide: USE_AUTH_EMULATOR, useValue: environment.useEmulators ? ['http://localhost:9099'] : undefined },
    { provide: USE_FIRESTORE_EMULATOR, useValue: environment.useEmulators ? ['localhost', 8080] : undefined },
    { provide: USE_FUNCTIONS_EMULATOR, useValue: environment.useEmulators ? ['localhost', 5001] : undefined },
    { provide: USE_STORAGE_EMULATOR, useValue: environment.useEmulators ? ['localhost', 9199] : undefined },
    { provide: ANALYTICS_DEBUG_MODE, useValue: false },
    { provide: COLLECTION_ENABLED, useValue: true },
    { provide: USE_DEVICE_LANGUAGE, useValue: true },
    { provide: APP_VERSION, useValue: '0.0.0' },
    { provide: APP_NAME, useValue: 'Angular' },
  ],
};
