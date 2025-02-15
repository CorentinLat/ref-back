import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { adviserPrefix, AllEditableGameComment, RefereeEditableGameComment, Game } from '../../../../../../type/refBack';

import { ElectronService } from '../../../service/ElectronService';
import { MatchAnalysisService } from '../../../service/MatchAnalysisService';
import { ToastService } from '../../../service/ToastService';

@Component({ templateUrl: './edit-game-comment-modal.component.html' })
export class EditGameCommentModalComponent implements OnInit {
    @Input() game!: Game;
    @Input() keyToEdit!: RefereeEditableGameComment;

    form = new FormGroup({ gameComment: new FormControl() });

    constructor(
        private readonly electronService: ElectronService,
        public readonly modal: NgbActiveModal,
        private readonly matchAnalysisService: MatchAnalysisService,
        private readonly toastService: ToastService,
    ) {}

    get fullKeyToEdit(): AllEditableGameComment {
        const keyPrefix = this.matchAnalysisService.role === 'referee' ? '' : adviserPrefix;
        return `${this.keyToEdit}${keyPrefix}`;
    }

    ngOnInit(): void {
        this.form.setValue({ gameComment: this.game[this.fullKeyToEdit] || '' });
    }

    async handleUpdateGameComment(): Promise<void> {
        const { gameComment } = this.form.value;
        if (gameComment === this.game[this.fullKeyToEdit]) {
            this.modal.close();
            return;
        }

        try {
            await this.electronService.updateGameComment(
                this.game.information.gameNumber,
                gameComment,
                this.fullKeyToEdit,
            );

            this.game[this.fullKeyToEdit] = this.form.value.gameComment;
            this.toastService.showSuccess(`TOAST.SUCCESS.${ this.keyToEdit }_EDITED`);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_GAME_COMMENT');
        } finally {
            this.modal.close();
        }
    }
}
