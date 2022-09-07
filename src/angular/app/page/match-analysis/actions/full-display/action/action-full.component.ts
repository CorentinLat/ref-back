import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Action } from '../../../../../domain/game';

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

    constructor(private dateTimeService: DateTimeService) {}

    exposeActionMinutes(): string {
        return this.dateTimeService.convertSecondsToMMSS(this.action.second);
    }

    handleRemoveAction(): void {
        this.removeActionEvent.emit(this.action.id);
    }
}
