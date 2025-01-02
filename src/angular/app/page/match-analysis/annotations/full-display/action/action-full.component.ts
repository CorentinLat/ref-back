import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Action } from '../../../../../../../../type/refBack';

import { CommunicationService } from '../../../../../service/CommunicationService';
import { DateTimeService } from '../../../../../service/DateTimeService';

@Component({
    selector: 'app-full-action',
    templateUrl: './action-full.component.html',
    styleUrls: ['./action-full.component.scss']
})
export class ActionFullComponent {
    @Input() action!: Action;

    @Input() isSummaryDisplay = false;
    @Input() isBySectorDisplay = false;

    @Input() putVideoAtSecond!: (second: number) => void;

    @Output() removeActionEvent = new EventEmitter<string>();

    constructor(
        private communicationService: CommunicationService,
        private dateTimeService: DateTimeService,
    ) {}

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

    handleEditAction(): void {
        this.putVideoAtSecond(this.action.second);
        this.communicationService.editAction.next(this.action);
    }

    handleRemoveAction(): void {
        this.removeActionEvent.emit(this.action.id);
    }
}
