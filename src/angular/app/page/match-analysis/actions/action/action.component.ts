import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Action } from '../../../../domain/game';

import { DateTimeService } from '../../../../service/DateTimeService';

@Component({
    selector: 'app-action',
    templateUrl: './action.component.html',
    styleUrls: ['./action.component.scss']
})
export class ActionComponent {
    @Input() action!: Action;

    @Output() editActionEvent = new EventEmitter<Action>();
    @Output() removeActionEvent = new EventEmitter<string>();

    constructor(private dateTimeService: DateTimeService) {}

    exposeActionMinutes(): string {
        return this.dateTimeService.convertSecondsToMMSS(this.action.second);
    }

    handleViewAction(): void {}

    handleEditAction(): void {
        this.editActionEvent.emit({ ...this.action, type: 'PENALTY_TRY' });
    }

    handleRemoveAction(): void {
        this.removeActionEvent.emit(this.action.id);
    }
}
