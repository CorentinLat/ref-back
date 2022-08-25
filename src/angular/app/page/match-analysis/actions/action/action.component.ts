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

    handleEditAction(): void {
        this.editActionEvent.emit({ ...this.action, type: 'Type Edited' });
    }

    handleRemoveAction(): void {
        this.removeActionEvent.emit(this.action.id);
    }
}
