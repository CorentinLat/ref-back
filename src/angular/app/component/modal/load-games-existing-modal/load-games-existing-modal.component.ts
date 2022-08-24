import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Game } from '../../../domain/game';

@Component({ templateUrl: './load-games-existing-modal.component.html' })
export class LoadGamesExistingModalComponent {
    @Input() games: Game[] = [];

    constructor(public modal: NgbActiveModal) {}
}
