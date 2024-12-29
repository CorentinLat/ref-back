import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { adviserPrefix, EditableGameComment, Game } from '../../../../../../../type/refBack';

import { EditGameCommentModalComponent } from '../../../../component/modal/edit-game-comment-modal/edit-game-comment-modal.component';

@Component({
    selector: 'app-game-comment-display',
    templateUrl: './game-comment-display.component.html',
    styleUrls: ['./game-comment-display.component.scss'],
})
export class GameCommentDisplayComponent {
    @Input() game!: Game;
    @Input() isEditable = false;
    @Input() keyToDisplay!: EditableGameComment;
    @Input() keyLabel!: string;

    constructor(private modalService: NgbModal) {}

    get adviserCommentKey(): string { return `${this.keyToDisplay}${adviserPrefix}`; }
    get refereeCommentKey(): string { return this.keyToDisplay; }

    handleUpdateGameComment(): void {
        const modal = this.modalService.open(EditGameCommentModalComponent, { centered: true, size: 'lg' });
        modal.componentInstance.game = this.game;
        modal.componentInstance.keyToEdit = this.keyToDisplay;
    }
}
