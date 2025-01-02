import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';
import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DecisionsComponent } from './page/decisions/decisions.component';
import { HomeComponent } from './page/home/home.component';
import { MatchAnalysisComponent } from './page/match-analysis/match-analysis.component';
import { AnnotationsComponent } from './page/match-analysis/annotations/annotations.component';
import { CollapseDisplayAnnotationsComponent } from './page/match-analysis/annotations/collapse-display/collapse-display-annotations.component';
import { FullDisplayActionsComponent } from './page/match-analysis/annotations/full-display/full-display-actions.component';
import { ActionFullComponent } from './page/match-analysis/annotations/full-display/action/action-full.component';
import { HandleMatchAnalysisComponent } from './page/match-analysis/handle-match-analysis/handle-match-analysis.component';
import { AddEditActionComponent } from './page/match-analysis/handle-match-analysis/add-edit-action/add-edit-action.component';
import { GameCommentDisplayComponent } from './page/match-analysis/handle-match-analysis/game-comment-display/game-comment-display.component';
import { SummaryComponent } from './page/summary/summary.component';
import { StatisticsComponent } from './page/summary/statistics/statistics.component';

import { ClipProcessLoaderModalComponent } from './component/modal/process-loader/clip-process-loader-modal.component';
import { EditGameCommentModalComponent } from './component/modal/edit-game-comment-modal/edit-game-comment-modal.component';
import { GameNumberExistingModalComponent } from './component/modal/game-number-existing-modal/game-number-existing-modal.component';
import { LoadGamesExistingModalComponent } from './component/modal/load-games-existing-modal/load-games-existing-modal.component';
import { NotEnoughRemainingSpaceModalComponent } from './component/modal/not-enough-remaining-space-modal/not-enough-remaining-space-modal.component';
import { VideoProcessLoaderModalComponent } from './component/modal/process-loader/video-process-loader-modal.component';
import { VideoEditorModalComponent } from './component/modal/video-editor-modal/video-editor-modal.component';
import { AnnotationCommentsDisplayComponent } from './component/shared/action-comments-display/annotation-comments-display.component';
import { CardComponent } from './component/shared/card/card.component';
import { GameInformationComponent } from './component/shared/game-information/game-information.component';
import { VideoViewerComponent } from './component/shared/video-viewer/video-viewer.component';
import { ToastsComponent } from './component/toasts/toasts.component';
import { VgNavigateComponent } from './component/videogular/vg-go-back/vg-navigate.component';

import DirectivesModule from './directive/directives.module';

const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './assets/i18n/', '.json');

@NgModule({
    declarations: [
        AnnotationCommentsDisplayComponent,
        ActionFullComponent,
        AnnotationsComponent,
        AddEditActionComponent,
        AppComponent,
        CardComponent,
        ClipProcessLoaderModalComponent,
        CollapseDisplayAnnotationsComponent,
        DecisionsComponent,
        EditGameCommentModalComponent,
        FullDisplayActionsComponent,
        GameCommentDisplayComponent,
        GameInformationComponent,
        GameNumberExistingModalComponent,
        HandleMatchAnalysisComponent,
        HomeComponent,
        LoadGamesExistingModalComponent,
        MatchAnalysisComponent,
        NotEnoughRemainingSpaceModalComponent,
        StatisticsComponent,
        SummaryComponent,
        ToastsComponent,
        VgNavigateComponent,
        VideoEditorModalComponent,
        VideoProcessLoaderModalComponent,
        VideoViewerComponent,
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        DirectivesModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
        NgMultiSelectDropDownModule.forRoot(),
        NgxChartsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: httpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        VgBufferingModule,
        VgCoreModule,
        VgControlsModule,
        VgOverlayPlayModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
