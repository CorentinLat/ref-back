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
import { ActionComponent } from './page/match-analysis/actions/action/action.component';
import { ActionsComponent } from './page/match-analysis/actions/actions.component';
import { AddActionComponent } from './page/match-analysis/add-action/add-action.component';
import { PageNotFoundComponent } from './page/page-not-found/page-not-found.component';

import { ToastsComponent } from './component/toasts/toasts.component';
import { GameNumberExistingModalComponent } from './component/modal/game-number-existing-modal/game-number-existing-modal.component';
import { LoadGamesExistingModalComponent } from './component/modal/load-games-existing-modal/load-games-existing-modal.component';

import DirectivesModule from './directive/directives.module';

const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './assets/i18n/', '.json');

@NgModule({
    declarations: [
        ActionComponent,
        ActionsComponent,
        AddActionComponent,
        AppComponent,
        GameNumberExistingModalComponent,
        LoadGamesExistingModalComponent,
        HomeComponent,
        MatchAnalysisComponent,
        PageNotFoundComponent,
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
