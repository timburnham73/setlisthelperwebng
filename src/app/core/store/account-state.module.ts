import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { AccountState } from './account.state';
import { AccountService } from '../services/account.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';

// NOTE on SSR safety:
// @ngxs/storage-plugin@18.x is already SSR-safe — its STORAGE_ENGINE provider uses a
// factory guarded by isPlatformServer/isPlatformBrowser, and NgxsStoragePlugin.handle()
// short-circuits on the server (returns next(state, event) without touching localStorage).
// The AOT-static `typeof window` conditional originally proposed in Plan 01-01 Task 2
// cannot be used inside an NgModule.imports array because Angular's template compiler
// requires statically analyzable references. Leaving the import as a plain static reference
// is correct — the plugin itself handles platform detection at runtime.

@NgModule({
    declarations: [],
    imports: [
        NgxsStoragePluginModule.forRoot({ keys: '*' }),
        NgxsModule.forFeature([AccountState])
    ],
    providers: [
        AccountService,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class AccountStateModule { }
