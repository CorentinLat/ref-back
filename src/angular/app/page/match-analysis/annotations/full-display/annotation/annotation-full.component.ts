import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Annotation } from '../../../../../../../../type/refBack';

import { DateTimeService } from '../../../../../service/DateTimeService';
import { MatchAnalysisService } from '../../../../../service/MatchAnalysisService';
import { VideoViewerService } from '../../../../../service/VideoViewerService';

@Component({
    selector: 'app-full-annotation',
    templateUrl: './annotation-full.component.html',
    styleUrls: ['./annotation-full.component.scss']
})
export class AnnotationFullComponent {
    @Input() annotation!: Annotation;
    @Input() isSummaryDisplay!: boolean;

    @Output() removeAnnotationEvent = new EventEmitter<string>();

    constructor(
        private readonly dateTimeService: DateTimeService,
        private readonly matchAnalysisService: MatchAnalysisService,
        private readonly videoViewerService: VideoViewerService,
    ) {}

    handleEditAnnotation(): void {
        this.handlePutVideoAtSecond(this.annotation.second);
        this.matchAnalysisService.editAnnotation(this.annotation);
    }

    handleRemoveAnnotation(): void {
        if (!this.isCreatorRole()) return;

        this.removeAnnotationEvent.emit(this.annotation.id);
    }

    handlePutVideoAtSecond = (second: number) => this.videoViewerService.updateVideoTime(second);

    isCreatorRole(): boolean {
        if (this.annotation.fromAdviser && this.matchAnalysisService.role === 'adviser') return true;
        if (!this.annotation.fromAdviser && this.matchAnalysisService.role === 'referee') return true;

        return false;
    }

    exposeAnnotationMinutes(): string {
        return this.dateTimeService.convertSecondsToMMSS(this.annotation.second);
    }

    exposeClipStartMinutes(): string {
        // @ts-ignore Called only when this.annotation.clip is defined
        return this.dateTimeService.convertSecondsToMMSS(this.annotation.clip?.start);
    }

    exposeClipEndMinutes(): string {
        // @ts-ignore Called only when this.annotation.clip is defined
        return this.dateTimeService.convertSecondsToMMSS(this.annotation.clip?.end);
    }
}
