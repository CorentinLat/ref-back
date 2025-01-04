import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DecisionsComponent } from './page/decisions/decisions.component';
import { HomeComponent } from './page/home/home.component';
import { MatchAnalysisComponent } from './page/match-analysis/match-analysis.component';
import { SummaryComponent } from './page/summary/summary.component';

const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        pathMatch: 'full',
    },
    {
        path: 'decisions',
        component: DecisionsComponent,
    },
    {
        path: 'match-analysis',
        component: MatchAnalysisComponent,
    },
    {
        path: 'summary',
        component: SummaryComponent,
    },
    {
        path: '**',
        redirectTo: '',
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
