import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './page/home/home.component';
import { MatchAnalysisComponent } from './page/match-analysis/match-analysis.component';
import { ActionsComponent } from './page/match-analysis/actions/actions.component';
import { CollapseDisplayActionsComponent } from './page/match-analysis/actions/collapse-display/collapse-display-actions.component';
import { FullDisplayActionsComponent } from './page/match-analysis/actions/full-display/full-display-actions.component';
import { ActionFullComponent } from './page/match-analysis/actions/full-display/action/action-full.component';
import { AddActionComponent } from './page/match-analysis/add-action/add-action.component';
import { SummaryComponent } from './page/summary/summary.component';

import { ToastsComponent } from './component/toasts/toasts.component';
import { GameNumberExistingModalComponent } from './component/modal/game-number-existing-modal/game-number-existing-modal.component';
import { LoadGamesExistingModalComponent } from './component/modal/load-games-existing-modal/load-games-existing-modal.component';

import DirectivesModule from './directive/directives.module';

const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './assets/i18n/', '.json');

@NgModule({
    declarations: [
        ActionFullComponent,
        ActionsComponent,
        AddActionComponent,
        AppComponent,
        CollapseDisplayActionsComponent,
        FullDisplayActionsComponent,
        GameNumberExistingModalComponent,
        HomeComponent,
        LoadGamesExistingModalComponent,
        MatchAnalysisComponent,
        SummaryComponent,
        ToastsComponent,
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        DirectivesModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: httpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        VgCoreModule,
        VgControlsModule,
        VgOverlayPlayModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
