import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Game } from '../../../../../../type/refBack';

import { ElectronService } from '../../../service/ElectronService';
import { ToastService } from '../../../service/ToastService';

@Component({ templateUrl: './edit-game-comment-modal.component.html' })
export class EditGameCommentModalComponent implements OnInit {
    @Input() game!: Game;
    @Input() keyToEdit!: 'gameDescription' | 'globalPerformance';

    form = new FormGroup({ gameComment: new FormControl() });

    constructor(
        private electronService: ElectronService,
        public modal: NgbActiveModal,
        private toastService: ToastService,
    ) {
    }

    ngOnInit(): void {
        this.form.setValue({ gameComment: this.game[this.keyToEdit] || '' });
    }

    async handleUpdateGameComment(): Promise<void> {
        const { gameComment } = this.form.value;
        if (gameComment === this.game[this.keyToEdit]) {
            this.modal.close();
            return;
        }

        try {
            await this.electronService.updateGameComment(
                this.game.information.gameNumber,
                gameComment,
                this.keyToEdit,
            );

            this.game[this.keyToEdit] = this.form.value.gameComment;
            this.toastService.showSuccess(`TOAST.SUCCESS.${ this.keyToEdit }_EDITED`);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_GAME_COMMENT');
        } finally {
            this.modal.close();
        }
    }
}
