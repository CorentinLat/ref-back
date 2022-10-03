import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { GameInformation } from '../../../domain/game';

import { ElectronService } from '../../../service/ElectronService';

@Component({ templateUrl: './load-games-existing-modal.component.html' })
export class LoadGamesExistingModalComponent implements OnInit {
    games!: GameInformation[];

    constructor(
        private electron: ElectronService,
        public modal: NgbActiveModal,
    ) {}

    ngOnInit(): void {
        this.electron
            .initApp()
            .then(({ games }) => {
                if (!games.length) { this.modal.dismiss({ noMoreGame: true }); }
                this.games = games;
            })
            .catch(() => this.modal.dismiss());
    }

    handleRemoveGame(gameNumberToRemove: string): void {
        this.electron
            .removeGame(gameNumberToRemove)
            .then(() => {
                this.games = this.games.filter(({ gameNumber }) => gameNumber !== gameNumberToRemove);
                if (!this.games.length) { this.modal.dismiss({ noMoreGame: true }); }
            })
            .catch(() => this.modal.dismiss());
    }
}
