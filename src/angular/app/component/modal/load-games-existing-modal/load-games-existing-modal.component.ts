import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({ templateUrl: './load-games-existing-modal.component.html' })
export class LoadGamesExistingModalComponent {
    @Input() gameNumbers: string[] = [];

    constructor(public modal: NgbActiveModal) {}
}
