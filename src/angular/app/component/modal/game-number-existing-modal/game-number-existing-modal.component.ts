import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({ templateUrl: './game-number-existing-modal.component.html' })
export class GameNumberExistingModalComponent {
    @Input() gameNumber = '';

    constructor(public modal: NgbActiveModal) {}
}
