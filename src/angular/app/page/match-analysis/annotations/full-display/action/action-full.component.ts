import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Action } from '../../../../../../../../type/refBack';

import { DateTimeService } from '../../../../../service/DateTimeService';
import { MatchAnalysisService } from '../../../../../service/MatchAnalysisService';
import { VideoViewerService } from '../../../../../service/VideoViewerService';

@Component({
    selector: 'app-full-action',
    templateUrl: './action-full.component.html',
    styleUrls: ['./action-full.component.scss']
})
export class ActionFullComponent {
    @Input() action!: Action;

    @Input() isSummaryDisplay = false;
    @Input() isBySectorDisplay = false;

    @Output() removeActionEvent = new EventEmitter<string>();

    constructor(
        private readonly dateTimeService: DateTimeService,
        private readonly matchAnalysisService: MatchAnalysisService,
        private readonly videoViewerService: VideoViewerService,
    ) {}

    handleEditAction(): void {
        this.handlePutVideoAtSecond(this.action.second);
        this.matchAnalysisService.editAnnotation(this.action);
    }

    handleRemoveAction(): void {
        this.removeActionEvent.emit(this.action.id);
    }

    handlePutVideoAtSecond = (second: number) => this.videoViewerService.updateVideoTime(second);

    exposeActionMinutes(): string {
        return this.dateTimeService.convertSecondsToMMSS(this.action.second);
    }

    exposeClipStartMinutes(): string {
        // @ts-ignore Called only when this.action.clip is defined
        return this.dateTimeService.convertSecondsToMMSS(this.action.clip?.start);
    }

    exposeClipEndMinutes(): string {
        // @ts-ignore Called only when this.action.clip is defined
        return this.dateTimeService.convertSecondsToMMSS(this.action.clip?.end);
    }
}
