import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { AccountState } from './account.state';
import { AccountService } from '../services/account.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';



@NgModule({ declarations: [], imports: [NgxsModule.forFeature([AccountState]),
        NgxsStoragePluginModule.forRoot()], providers: [
        AccountService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AccountStateModule { }
