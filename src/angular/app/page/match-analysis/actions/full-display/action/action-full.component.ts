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

    @Input() putVideoAtSecond!: (second: number) => void;

    @Output() editActionEvent = new EventEmitter<Action>();
    @Output() removeActionEvent = new EventEmitter<string>();

    constructor(private dateTimeService: DateTimeService) {}

    exposeActionMinutes(): string {
        return this.dateTimeService.convertSecondsToMMSS(this.action.second);
    }

    handleEditAction(): void {
        this.editActionEvent.emit({ ...this.action, type: 'PENALTY_TRY' });
    }

    handleRemoveAction(): void {
        this.removeActionEvent.emit(this.action.id);
    }
}
