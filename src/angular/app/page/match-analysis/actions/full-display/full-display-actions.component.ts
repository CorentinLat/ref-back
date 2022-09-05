import { Component, Input } from '@angular/core';

import { Action } from '../../../../domain/game';

import CommunicationService from '../../../../service/CommunicationService';
import { ToastService } from '../../../../service/ToastService';

@Component({
  selector: 'app-full-display-actions',
  templateUrl: './full-display-actions.component.html',
  styleUrls: ['./full-display-actions.component.scss']
})
export class FullDisplayActionsComponent {
    @Input() actions!: Action[];
    @Input() gameNumber!: string;

    @Input() putVideoAtSecond!: (second: number) => void;

    constructor(
        private communication: CommunicationService,
        private toastService: ToastService,
    ) {}

    async editAction(actionEdited: Action): Promise<void> {
        const action = this.actions.find(({ id }) => id === actionEdited.id);
        if (!action) { return; }

        try {
            await this.communication.editActionFromGame(actionEdited, this.gameNumber);
            action.second = actionEdited.second;
            action.type = actionEdited.type;
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_EDIT_FAILED');
        }
    }

    async removeAction(actionId: string): Promise<void> {
        const actionIndex = this.actions.findIndex(action => action.id === actionId);
        if (actionIndex === -1) { return; }

        try {
            await this.communication.removeActionFromGame(actionId, this.gameNumber);
            this.actions.splice(actionIndex, 1);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_REMOVE_FAILED');
        }
    }
}
