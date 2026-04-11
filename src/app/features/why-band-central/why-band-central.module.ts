import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhyBandCentralRoutingModule } from './why-band-central-routing.module';
import { WhyBandCentralComponent } from './why-band-central.component';

@NgModule({
  imports: [
    CommonModule,
    WhyBandCentralRoutingModule,
    WhyBandCentralComponent
  ]
})
export class WhyBandCentralModule {}
