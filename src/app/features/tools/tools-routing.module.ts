import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ToolsLandingComponent } from './tools-landing/tools-landing.component';
import { TapTempoComponent } from './tap-tempo/tap-tempo.component';
import { TransposeComponent } from './transpose/transpose.component';
import { MetronomeComponent } from './metronome/metronome.component';

const routes: Routes = [
  { path: '', component: ToolsLandingComponent },
  { path: 'tap-tempo', component: TapTempoComponent },
  { path: 'transpose', component: TransposeComponent },
  { path: 'metronome', component: MetronomeComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ToolsRoutingModule {}
