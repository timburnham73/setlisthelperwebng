import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsLandingComponent } from './tools-landing/tools-landing.component';
import { TapTempoComponent } from './tap-tempo/tap-tempo.component';
import { TransposeComponent } from './transpose/transpose.component';
import { MetronomeComponent } from './metronome/metronome.component';

@NgModule({
  imports: [
    CommonModule,
    ToolsRoutingModule,
    ToolsLandingComponent,
    TapTempoComponent,
    TransposeComponent,
    MetronomeComponent,
  ],
})
export class ToolsModule {}
