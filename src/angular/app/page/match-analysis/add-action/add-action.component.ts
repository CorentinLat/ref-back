import { Component, Input } from '@angular/core';

import { Action, NewAction } from '../../../domain/game';

import CommunicationService from '../../../service/CommunicationService';
import { ToastService } from '../../../service/ToastService';

@Component({
    selector: 'app-add-action',
    templateUrl: './add-action.component.html',
    styleUrls: ['./add-action.component.scss']
})
export class AddActionComponent {
    @Input() actions!: Action[];
    @Input() gameNumber!: string;

    constructor(
        private communication: CommunicationService,
        private toastService: ToastService,
    ) {}

    async handleAddAction(): Promise<void> {
        const newAction: NewAction = { time: Date.now(), type: 'Type' };

        try {
            const action = await this.communication.addActionToGame(newAction, this.gameNumber);
            this.actions.push(action);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_ADD_FAILED');
        }
    }
}
