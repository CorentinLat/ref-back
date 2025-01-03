import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ElectronService } from '../../../service/ElectronService';
import { ToastService } from '../../../service/ToastService';

@Component({
    templateUrl: './export-game-modal.component.html',
    styleUrls: ['./export-game-modal.component.scss'],
})
export class ExportGameModalComponent {
    @Input() gameNumber!: string;

    exportWithVideo = false;

    isExportingGame = false;

    constructor(
        private readonly electron: ElectronService,
        private readonly modal: NgbActiveModal,
        private readonly toastService: ToastService,
    ) {}

    handleCloseModal = () => this.modal.dismiss();

    async handleExportGame() {
        this.isExportingGame = true;

        try {
            await this.electron.exportGame(this.gameNumber, this.exportWithVideo);

            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_EXPORT_GAME');
            this.modal.close();
        } catch (error: any) {
            if (!error?.closed) {
                this.toastService.showError('TOAST.ERROR.PROCESS_EXPORT_GAME');
            }
        } finally {
            this.isExportingGame = false;
        }
    }
}
