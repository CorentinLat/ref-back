import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Action } from '../../../../domain/game';

@Component({
    selector: 'app-action',
    templateUrl: './action.component.html',
    styleUrls: ['./action.component.scss']
})
export class ActionComponent {
    @Input() action!: Action;

    @Output() editActionEvent = new EventEmitter<Action>();
    @Output() removeActionEvent = new EventEmitter<string>();

    constructor() {}

    exposeActionMinutes(): string {
        const minutes = Math.floor(this.action.second / 60);
        const minutesStr = minutes.toString().padStart(2, '0');
        const seconds = this.action.second % 60;
        const secondsStr = seconds.toString().padStart(2, '0');

        return minutesStr + ':' + secondsStr;
    }

    handleViewAction(): void {
        this.editActionEvent.emit({ ...this.action, type: 'Type Edited' });
    }

    handleEditAction(): void {
        this.editActionEvent.emit({ ...this.action, type: 'Type Edited' });
    }

    handleRemoveAction(): void {
        this.removeActionEvent.emit(this.action.id);
    }
}
