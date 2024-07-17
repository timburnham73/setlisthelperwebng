import { NgModule } from "@angular/core";
import {
  Routes,
  RouterModule,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  ExtraOptions,
  provideRouter,
  withDebugTracing,
  withViewTransitions,
} from "@angular/router";
import {
  AngularFireAuthGuard,
  redirectUnauthorizedTo,
} from "@angular/fire/compat/auth-guard";

const redirectUnauthorizedToLogin = () =>
  redirectUnauthorizedTo(["auth/login"]);

const appRoutes: Routes = [
  {
    path: "home",
    loadChildren: () =>
      import("./features/home/home.module").then((m) => m.HomeModule),
  },
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.module").then((m) => m.AuthModule),
  },
  {
    path: "accounts",
    loadChildren: () =>
      import("./features/accounts/account.module").then(
        (m) => m.AccountsModule
      ),
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: "users",
    loadChildren: () =>
      import("./features/users/users.module").then((m) => m.UsersModule),
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: "about",
    loadChildren: () =>
      import("./features/about/about.module").then((m) => m.AboutModule),
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: "**",
    redirectTo: "home",
    pathMatch: "full",
  },
];

export const routingConfiguration: ExtraOptions = {
  paramsInheritanceStrategy: 'always',
    onSameUrlNavigation: 'reload'
};

@NgModule({
  imports: [RouterModule.forRoot(appRoutes, routingConfiguration)],
  exports: [RouterModule],
  providers: [ provideRouter(appRoutes, withViewTransitions())],
})
export class AppRoutingModule {}
