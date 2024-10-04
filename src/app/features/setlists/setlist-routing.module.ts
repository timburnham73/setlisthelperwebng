import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LayoutComponent } from "src/app/shared/layout/layout.component";
import { SetlistListComponent } from "./setlist-list/setlist-list.component";
import { RouterModule, Routes } from "@angular/router";
import { SetlistSongsListComponent } from "./setlist-songs-list/setlist-songs-list.component";
import {
  AngularFireAuthGuard,
  redirectUnauthorizedTo,
} from "@angular/fire/compat/auth-guard";
import { LayoutNoSidebarChildViewComponent } from "src/app/shared/layout-no-sidebar-child-view/layout-no-sidebar-child-view.component";
import { SetlistPrintComponent } from "./setlist-print/setlist-print.component";

const routes: Routes = [
  {
    path: "",
    component: LayoutComponent,
    children: [
      { path: "", component: SetlistListComponent, data: { shouldReuse: true } },
    ],
  },
  {
    path: ":setlistid/songs",
    component: LayoutNoSidebarChildViewComponent,
    children: [
      { path: "", component: SetlistSongsListComponent },
    ],
  },
  {
    path: ":setlistid/print",
    component: LayoutNoSidebarChildViewComponent,
    children: [
      { path: "", component: SetlistPrintComponent },
    ],
  },
  {
    path: ":setlistid/songs/:songid/lyrics",
    loadChildren: () =>
      import("../lyrics/lyrics.module").then((m) => m.LyricsModule),
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedTo },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetlistRoutingModule {}
