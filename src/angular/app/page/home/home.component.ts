import { Component, HostListener, NgZone, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { GameNumberExistingModalComponent } from '../../component/modal/game-number-existing-modal/game-number-existing-modal.component';
import { LoadGamesExistingModalComponent } from '../../component/modal/load-games-existing-modal/load-games-existing-modal.component';

import CommunicationService from '../../service/CommunicationService';
import { FileService } from '../../service/FileService';
import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    isLoadingApp = false;

    gameForm = new FormGroup({
        gameNumber: new FormControl(
            '',
            [Validators.required, Validators.pattern('^\\d{2}\\s\\d{4}\\s\\d{4}$')]
        ),
        video: new FormControl(null, [Validators.required]),
    });

    readonly gameNumberPrefix = '202223';
    readonly gameNumberSuffix = 'RCT';

    files: File[] = [];
    notSupportedFiles: File[] = [];

    isProcessingVideos = false;
    progress = 0;

    modalsCount = 0;

    constructor(
        private communication: CommunicationService,
        private fileService: FileService,
        private modalService: NgbModal,
        private router: Router,
        private toastService: ToastService,
        private zone: NgZone
    ) {}

    get gameNumberControl(): FormControl { return this.gameForm.get('gameNumber') as FormControl; }
    get videoControl(): FormControl { return this.gameForm.get('video') as FormControl; }

    @HostListener('change', ['$event.target.files'])
    emitFiles(files: FileList) {
        if (!files) { return; }

        this.files = [];
        this.notSupportedFiles = [];

        const fileExtensions = new Set<string>();
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (!file) { continue; }

            if (this.fileService.isFileSupported(file)) {
                this.files.push(file);
            } else {
                this.notSupportedFiles.push(file);
            }
            fileExtensions.add(this.fileService.extractFileExtension(file));
        }

        if (this.notSupportedFiles.length) {
            this.videoControl.setErrors({ invalidType: true });
        } else if (fileExtensions.size > 1) {
            this.videoControl.setErrors({ multipleVideoFormat: true });
        }
    }

    ngOnInit() {
        this.isLoadingApp = true;

        this.communication.getExistingGameNumbers().then(this.handleExistingGames);

        this.communication.getProcessVideoProgress().subscribe(progress => this.zone.run(() => this.progress = Math.round(progress)));
        this.modalService.activeInstances.subscribe(list => this.modalsCount = list.length);
    }

    exposeClassNameForGameNumberInput(): string {
        if (this.gameNumberControl.pristine || this.gameNumberControl.untouched) {
            return 'form-control';
        }
        return this.isGameNumberControlValid() ? 'form-control is-valid' : 'form-control is-invalid';
    }

    exposeClassNameForVideoInput(): string {
        if (this.videoControl.pristine) {
            return 'form-control';
        }
        return this.isVideoControlValid() ? 'form-control is-valid' : 'form-control is-invalid';
    }

    exposeErrorFileNames(): string[] {
        return this.notSupportedFiles.map(({ name }) => name);
    }

    async submit(force: boolean = false) {
        if (this.gameForm.invalid) {
            return;
        }

        const videoPaths = this.files.map(({ path }) => path);

        this.isProcessingVideos = true;
        try {
            const gameNumber = await this.communication.createNewGame(force, this.getGameNumber(), videoPaths);
            this.navigateToMatchAnalysisPage(gameNumber);
        } catch (error) {
            this.handleProcessVideosFailed(error);
        }
    }

    private handleExistingGames = (gameNumbers: string[]) => {
        if (gameNumbers.length) {
            const modal = this.modalService.open(LoadGamesExistingModalComponent, { centered: true, size: 'lg' });
            modal.componentInstance.gameNumbers = gameNumbers;
            modal.result
                .then((gameNumber: string) => this.navigateToMatchAnalysisPage(gameNumber))
                .finally(() => this.isLoadingApp = false);
        } else {
            this.isLoadingApp = false;
        }
    };

    private handleProcessVideosFailed = (error: any) => {
        this.isProcessingVideos = false;

        if (error?.alreadyExisting) {
            if (this.modalsCount > 0) { return; }

            const gameNumber = this.getGameNumber();
            const modal = this.modalService.open(GameNumberExistingModalComponent, { centered: true, size: 'lg' });
            modal.componentInstance.gameNumber = gameNumber;
            modal.result.then(
                async ({ overwrite }: { overwrite: boolean }) => {
                    if (overwrite) {
                        await this.submit(true);
                    } else {
                        this.navigateToMatchAnalysisPage(gameNumber);
                    }
                },
                () => this.gameNumberControl.setErrors({ alreadyExisting: true }),
            );
        } else {
            this.videoControl.setErrors({ processVideoFailed: true });
            this.toastService.showError('TOAST.ERROR.PROCESS_VIDEO_FAILED');
        }
    };

    private isGameNumberControlValid(): boolean {
        return this.gameNumberControl.valid;
    }

    private isVideoControlValid(): boolean {
        return this.videoControl.valid || (this.videoControl.invalid && this.videoControl.errors?.required);
    }

    private getGameNumber(): string {
        return `${this.gameNumberPrefix} ${this.gameNumberControl.value} ${this.gameNumberSuffix}`;
    }

    private navigateToMatchAnalysisPage(gameNumber: string) {
        this.router.navigate(['/match-analysis'], { queryParams: { gameNumber } });
    }
}
