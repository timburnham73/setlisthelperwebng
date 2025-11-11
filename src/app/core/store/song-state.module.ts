import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { SongState } from './song.state';

@NgModule({
  declarations: [],
  imports: [NgxsModule.forFeature([SongState])],
  providers: [],
})
export class SongStateModule {}
