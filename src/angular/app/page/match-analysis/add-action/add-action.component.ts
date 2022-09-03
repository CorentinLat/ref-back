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
    @Input() getCurrentVideoTime!: () => number;

    constructor(
        private communication: CommunicationService,
        private toastService: ToastService,
    ) {}

    async handleAddAction(): Promise<void> {
        const newAction: NewAction = {
            second: this.getCurrentVideoTime(),
            type: 'Type',
            against: 'Against',
            sector: 'Sector',
            fault: 'Fault',
            precise: 'YES',
            comment: 'Comment',
        };

        try {
            const action = await this.communication.addActionToGame(newAction, this.gameNumber);
            this.actions.push(action);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_ADD_FAILED');
        }
    }
}
