import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({ templateUrl: './not-enough-remaining-space-modal.component.html' })
export class NotEnoughRemainingSpaceModalComponent {
    constructor(public modal: NgbActiveModal) {}
}
