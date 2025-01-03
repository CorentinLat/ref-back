import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { GameInformation, ImportGameInitCommandOutput } from '../../../../../../type/refBack';

import { DateTimeService } from '../../../service/DateTimeService';
import { ElectronService } from '../../../service/ElectronService';
import { ToastService } from '../../../service/ToastService';

@Component({
    templateUrl: './import-game-modal.component.html',
    styleUrls: ['./import-game-modal.component.scss'],
})
export class ImportGameModalComponent implements OnInit {
    @Input() gameInformations: GameInformation[] = [];

    readonly gameNumberPrefix = this.dateService.getCurrentSeasonYears();
    readonly gameNumberSuffix = 'RCT';

    importDetails?: ImportGameInitCommandOutput;
    isImportingGame = false;
    isImportValid = false;

    isCreatingNewGame?: boolean;
    isOverriding?: boolean;
    gameNumberToUse?: string;

    constructor(
        private readonly dateService: DateTimeService,
        private readonly electron: ElectronService,
        private readonly modal: NgbActiveModal,
        private readonly toastService: ToastService,
    ) {}

    async ngOnInit() {
        try {
            const gameImportDetails = await this.electron.importGameInit();

            this.isImportValid = gameImportDetails.hasVideo || gameImportDetails.hasOtherGames;
            this.importDetails = gameImportDetails;
        } catch (error: any) {
            if (!error?.closed) {
                this.toastService.showError('TOAST.ERROR.PROCESS_IMPORT_GAME');
            }

            this.modal.dismiss();
        }
    }

    handleCloseModal = () => this.modal.dismiss();

    handleCreateGameChanged = () => {
        this.isOverriding = undefined;
        this.gameNumberToUse = undefined;
    };

    async handleImportGame() {
        if (this.exposeImportGameIsInvalid()) return;

        this.isImportingGame = true;
        try {
            await this.electron.importGame({
                isCreatingNewGame: this.isCreatingNewGame,
                isOverriding: this.isOverriding,
                gameNumberToUse: this.isCreatingNewGame ? this.exposeGetGameNumberForNewGame() : this.gameNumberToUse,
            });

            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_IMPORT_GAME');
            this.modal.close();
        } catch (error: any) {
            this.toastService.showError('TOAST.ERROR.PROCESS_IMPORT_GAME');
        } finally {
            this.isImportingGame = false;
        }
    }

    exposeImportGameIsInvalid = () =>
        !this.importDetails
        || this.isImportingGame
        || !this.isImportValid
        || (!this.isCreatingNewGame && this.isOverriding === undefined)
        || (this.isCreatingNewGame && this.importDetails.gameNumberAlreadyExists && !this.isOverriding && this.exposeGameNumberIsInvalidForNewGame());

    exposeGameNumberIsInvalidForNewGame = () =>
        !this.gameNumberToUse
        || this.gameNumberToUse.match('^\\d{2}\\s\\d{4}\\s\\d{4}$') === null
        || this.gameInformations.some(gameInformation => gameInformation.gameNumber === this.exposeGetGameNumberForNewGame());

    exposeGetGameNumberForNewGame = () =>
        this.gameNumberToUse
            ? `${this.gameNumberPrefix} ${this.gameNumberToUse} ${this.gameNumberSuffix}`
            : undefined;
}
