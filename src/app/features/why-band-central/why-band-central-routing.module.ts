import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WhyBandCentralComponent } from './why-band-central.component';

const routes: Routes = [
  { path: '', component: WhyBandCentralComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WhyBandCentralRoutingModule {}
