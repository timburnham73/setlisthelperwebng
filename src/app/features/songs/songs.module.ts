import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongRoutingModule } from './songs-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { SongListComponent } from './song-list/song-list.component';
import { SongEditDialogComponent } from './song-edit-dialog/song-edit-dialog.component';
import { SongImportComponent } from './song-import/song-import.component';
import { RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuseStrategy } from 'src/app/core/route-reuse-strategy/custom-route-reuse-strategy';

@NgModule({
    imports: [
        CommonModule,
        SongRoutingModule,
        SharedModule,
        SongListComponent,
        SongEditDialogComponent,
        SongImportComponent
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy },
      ]
})
export class SongsModule { }
