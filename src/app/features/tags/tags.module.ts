import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { TagListComponent } from './tag-list/tag-list.component';
import { TagRoutingModule } from './tags-routing.module';
import { RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuseStrategy } from 'src/app/core/route-reuse-strategy/custom-route-reuse-strategy';

@NgModule({
    imports: [
        CommonModule,
        TagRoutingModule,
        SharedModule,   
        TagListComponent,
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy },
      ]
})
export class TagsModule { }
