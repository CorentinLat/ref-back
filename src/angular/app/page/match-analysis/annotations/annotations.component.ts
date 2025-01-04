import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Action, Annotation } from '../../../../../../type/refBack';

import { MatchAnalysisService } from '../../../service/MatchAnalysisService';

@Component({
    selector: 'app-annotations',
    templateUrl: './annotations.component.html',
    styleUrls: ['./annotations.component.scss']
})
export class AnnotationsComponent implements OnInit, OnDestroy {
    @Input() annotations!: (Action|Annotation)[];
    @Input() gameNumber!: string;

    isCollapsed: boolean;

    private isCollapsedUpdatedSubscription$?: Subscription;

    constructor(private readonly matchAnalysisService: MatchAnalysisService) {
        this.isCollapsed = this.matchAnalysisService.isCollapsed;
    }

    ngOnInit(): void {
        this.isCollapsedUpdatedSubscription$ = this.matchAnalysisService.isCollapsedUpdated.subscribe(isCollapsed => this.isCollapsed = isCollapsed);
    }

    ngOnDestroy() {
        this.isCollapsedUpdatedSubscription$?.unsubscribe();
    }

    exposeAnnotationsSortedByTime(): (Action|Annotation)[] {
        return this.annotations.sort((a, b) => a.second - b.second);
    }
}
