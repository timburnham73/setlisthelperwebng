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
  RouteReuseStrategy,
} from "@angular/router";
import {
  AngularFireAuthGuard,
  redirectUnauthorizedTo,
} from "@angular/fire/compat/auth-guard";
import { CustomRouteReuseStrategy } from "./core/route-reuse-strategy/custom-route-reuse-strategy";

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
    path: "admin",
    loadChildren: () =>
      import("./features/admin/admin.module").then((m) => m.AdminModule),
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: "bands",
    loadChildren: () =>
      import("./features/accounts/account.module").then(
        (m) => m.AccountsModule
      ),
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin, shouldReuse: true },
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
    path: "privacy-policy",
    loadChildren: () =>
      import("./features/privacy-policy/privacy-policy.module").then(
        (m) => m.PrivacyPolicyModule
      ),
  },
  {
    path: "help",
    loadChildren: () =>
      import("./features/help/help.module").then((m) => m.HelpModule),
  },
  {
    path: "contact",
    loadChildren: () =>
      import("./features/contact/contact.module").then(
        (m) => m.ContactModule
      ),
  },
  {
    path: "blog",
    loadChildren: () =>
      import("./features/blog/blog.module").then((m) => m.BlogModule),
  },
  {
    path: "tools",
    loadChildren: () =>
      import("./features/tools/tools.module").then((m) => m.ToolsModule),
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
  providers: [ provideRouter(appRoutes, withViewTransitions()), { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy }],
})
export class AppRoutingModule {}
