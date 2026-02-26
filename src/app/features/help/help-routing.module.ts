import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HelpLandingComponent } from './help-landing/help-landing.component';
import { HelpPageComponent } from './help-page/help-page.component';
import { HelpMigrationComponent } from './help-migration/help-migration.component';

const routes: Routes = [
  {
    path: '',
    component: HelpLandingComponent,
  },
  {
    path: 'migration',
    component: HelpMigrationComponent,
  },
  {
    path: ':platform',
    component: HelpPageComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HelpRoutingModule { }
