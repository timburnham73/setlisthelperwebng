import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HelpRoutingModule } from './help-routing.module';
import { HelpLandingComponent } from './help-landing/help-landing.component';
import { HelpPageComponent } from './help-page/help-page.component';
import { HelpMigrationComponent } from './help-migration/help-migration.component';

@NgModule({
  imports: [
    CommonModule,
    HelpRoutingModule,
    HelpLandingComponent,
    HelpPageComponent,
    HelpMigrationComponent
  ]
})
export class HelpModule { }
