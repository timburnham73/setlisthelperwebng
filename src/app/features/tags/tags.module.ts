import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { TagListComponent } from './tag-list/tag-list.component';
import { TagRoutingModule } from './tags-routing.module';

@NgModule({
    imports: [
        CommonModule,
        TagRoutingModule,
        SharedModule,   
        TagListComponent,
    ]
})
export class TagsModule { }
