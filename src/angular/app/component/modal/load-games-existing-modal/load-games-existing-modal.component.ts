import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import CommunicationService from '../../../service/CommunicationService';

@Component({ templateUrl: './load-games-existing-modal.component.html' })
export class LoadGamesExistingModalComponent implements OnInit {
    gameNumbers!: string[];

    constructor(
        private communication: CommunicationService,
        public modal: NgbActiveModal,
    ) {}

    ngOnInit(): void {
        this.communication
            .initApp()
            .then(({ gameNumbers }) => {
                if (!gameNumbers.length) { this.modal.dismiss({ noMoreGame: true }); }
                this.gameNumbers = gameNumbers;
            })
            .catch(() => this.modal.dismiss());
    }

    handleRemoveGame(gameNumberToRemove: string): void {
        this.communication
            .removeGame(gameNumberToRemove)
            .then(() => {
                this.gameNumbers = this.gameNumbers.filter(gameNumber => gameNumber !== gameNumberToRemove);
                if (!this.gameNumbers.length) { this.modal.dismiss({ noMoreGame: true }); }
            })
            .catch(() => this.modal.dismiss());
    }
}
