import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { Action, Annotation } from '../../../../../../../type/refBack';

import { DateTimeService } from '../../../../service/DateTimeService';
import { MatchAnalysisService } from '../../../../service/MatchAnalysisService';
import { VideoViewerService } from '../../../../service/VideoViewerService';

@Component({
  selector: 'app-collapse-display-annotations',
  templateUrl: './collapse-display-annotations.component.html',
  styleUrls: ['./collapse-display-annotations.component.scss']
})
export class CollapseDisplayAnnotationsComponent implements OnInit, OnDestroy {
    @Input() annotations!: (Action|Annotation)[];

    @ViewChild('scrollable') scrollable!: ElementRef;

    private readonly annotationHeightPx = 100;
    private readonly gapPx = 14;
    private readonly topMarginPx = 20;

    private newAnnotationSubscription?: Subscription;

    constructor(
        private readonly dateTimeService: DateTimeService,
        private readonly matchAnalysisService: MatchAnalysisService,
        private readonly videoViewerService: VideoViewerService,
    ) {}

    ngOnInit(): void {
        this.newAnnotationSubscription = this.matchAnalysisService.annotationAdded.subscribe(annotation => {
            const index = this.annotations.findIndex(({ id }) => id === annotation.id);
            const annotationPosition = Math.max(
                index * this.annotationHeightPx + Math.max(index - 1, 0) * this.gapPx - this.topMarginPx,
                0
            );

            this.scrollable.nativeElement.scroll({ top: annotationPosition, behavior: 'smooth' });
        });
    }

    ngOnDestroy(): void {
        this.newAnnotationSubscription?.unsubscribe();
    }

    handleEditVideoMedia = () => this.videoViewerService.editVideoMedia();
    handlePutVideoAtSecond = (second: number) => this.videoViewerService.updateVideoTime(second);

    exposeActionMinutes(second: number): string {
        return this.dateTimeService.convertSecondsToMMSS(second);
    }
}
