import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, OperatorFunction } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { GameNumberExistingModalComponent } from '../../component/modal/game-number-existing-modal/game-number-existing-modal.component';
import { LoadGamesExistingModalComponent } from '../../component/modal/load-games-existing-modal/load-games-existing-modal.component';
import { NotEnoughRemainingSpaceModalComponent } from '../../component/modal/not-enough-remaining-space-modal/not-enough-remaining-space-modal.component';
import { VideoProcessLoaderModalComponent } from '../../component/modal/process-loader/video-process-loader-modal.component';

import { DateTimeService } from '../../service/DateTimeService';
import { ElectronService } from '../../service/ElectronService';
import { FfrService } from '../../service/FfrService';
import { FileService } from '../../service/FileService';
import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit {
    readonly gameNumberPrefix = this.dateService.getCurrentSeasonYears();
    readonly gameNumberSuffix = 'RCT';

    readonly veoUrlPrefix = 'https://app.veo.co/';

    appVersion = '';
    hasExistingGames = false;

    gameForm = new FormGroup({
        gameNumber: new FormControl(
            '',
            [Validators.required, Validators.pattern('^\\d{2}\\s\\d{4}\\s\\d{4}$')]
        ),
        date: new FormControl(this.dateService.getLastSundayDate(), Validators.required),
        teams: new FormGroup({
            local: new FormControl('', Validators.required),
            visitor: new FormControl('', Validators.required),
        }),
        score: new FormGroup({
            local: new FormControl(
                0,
                [Validators.required, Validators.pattern('^\\d{1,3}$')]
            ),
            visitor: new FormControl(
                0,
                [Validators.required, Validators.pattern('^\\d{1,3}$')]
            ),
        }),
        video: new FormGroup(
            {
                options: new FormControl('file', Validators.required),
                file: new FormControl(null),
                veo: new FormControl(null, Validators.pattern(`^${this.veoUrlPrefix}.+$`)),
            },
            {
                validators: (group: AbstractControl) => {
                    const { options, file, veo } = group.value;
                    if (options === 'file' && !file) {
                        return { required: true };
                    }
                    if (options === 'veo' && !veo) {
                        return { required: true };
                    }
                    return null;
                }
            }
        ),
    });

    files: File[] = [];
    notSupportedFiles: File[] = [];

    isProcessingVideos = false;

    constructor(
        private dateService: DateTimeService,
        private electron: ElectronService,
        private ffrService: FfrService,
        private fileService: FileService,
        private modalService: NgbModal,
        private router: Router,
        private toastService: ToastService,
    ) {}

    get gameNumberControl(): FormControl { return this.gameForm.get('gameNumber') as FormControl; }
    get dateControl(): FormControl { return this.gameForm.get('date') as FormControl; }
    get teamsGroup(): FormGroup { return this.gameForm.get('teams') as FormGroup; }
    get localTeamControl(): FormControl { return this.teamsGroup.get('local') as FormControl; }
    get visitorTeamControl(): FormControl { return this.teamsGroup.get('visitor') as FormControl; }
    get scoreGroup(): FormGroup { return this.gameForm.get('score') as FormGroup; }
    get localScoreControl(): FormControl { return this.scoreGroup.get('local') as FormControl; }
    get visitorScoreControl(): FormControl { return this.scoreGroup.get('visitor') as FormControl; }
    get videoGroup(): FormGroup { return this.gameForm.get('video') as FormGroup; }
    get videoOptionsControl(): FormControl { return this.videoGroup.get('options') as FormControl; }
    get videoFileControl(): FormControl { return this.videoGroup.get('file') as FormControl; }
    get videoVeoControl(): FormControl { return this.videoGroup.get('veo') as FormControl; }

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
            this.videoFileControl.setErrors({ invalidType: true });
        } else if (fileExtensions.size > 1) {
            this.videoFileControl.setErrors({ multipleVideoFormat: true });
        }
    }

    ngOnInit() {
        this.electron
            .initApp()
            .then(({ appVersion, games }) => {
                this.appVersion = appVersion;
                this.hasExistingGames = games.length > 0;
            });
    }

    exposeClassNameForFormControl(formControl: FormControl): string {
        return !formControl || formControl.pristine || formControl.valid
            ? 'form-control'
            : 'form-control is-invalid';
    }

    exposeFormControlHasError(formControl: FormControl, error: string): boolean {
        return formControl.dirty && formControl.hasError(error);
    }

    searchTeams: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term =>
                this.ffrService.searchTeams(term).pipe(
                    catchError(() => of([]))
                )
            )
        );

    exposeFormGroupIsInvalid(formGroup: FormGroup): boolean {
        const isFormGroupDirty = Object.values(formGroup.controls).every(control => control.dirty);
        return isFormGroupDirty && formGroup.invalid;
    }

    exposeErrorFileNames(): string[] {
        return this.notSupportedFiles.map(({ name }) => name);
    }

    async submit(force: boolean = false) {
        if (this.gameForm.invalid) {
            return;
        }

        const { videoOptions, videoFile, videoVeo, ...gameInformation } = this.gameForm.value;
        const videoPaths = this.files.map(({ path }) => path);

        this.isProcessingVideos = true;
        const modal = this.modalService.open(VideoProcessLoaderModalComponent, { backdrop: 'static', centered: true });
        try {
            const gameNumber = await this.electron.createNewGame(
                force,
                { ...gameInformation, gameNumber: this.getGameNumber() },
                videoPaths,
            );

            this.navigateToMatchAnalysisPage(gameNumber);
        } catch (error) {
            this.handleProcessVideosFailed(error);
        } finally {
            this.isProcessingVideos = false;
            modal.close();
        }
    }

    async handleDisplayExistingGames() {
        const modal = this.modalService.open(LoadGamesExistingModalComponent, { centered: true, size: 'lg' });
        modal.result
            .then((gameNumber: string) => this.navigateToMatchAnalysisPage(gameNumber))
            .catch((reason?: { noMoreGame?: boolean }) => {
                if (reason?.noMoreGame) {
                    this.hasExistingGames = false;
                }
            });
    };

    handleOpenUrlInBrowser(url: string) {
        this.electron.openUrlInBrowser(url);
    }

    private handleProcessVideosFailed = (error: any) => {
        if (error?.alreadyExisting) {
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
        } else if (error?.notEnoughSpace) {
            this.modalService.open(NotEnoughRemainingSpaceModalComponent, { centered: true });
            this.videoFileControl.setErrors({ notEnoughSpace: true });
        } else if (error?.cancelled) {
            this.toastService.showInfo('TOAST.INFO.PROCESS_VIDEO_CANCELLED');
        } else {
            this.videoFileControl.setErrors({ processVideoFailed: true });
            this.toastService.showError('TOAST.ERROR.PROCESS_VIDEO');
        }
    };

    private getGameNumber(): string {
        return `${this.gameNumberPrefix} ${this.gameNumberControl.value} ${this.gameNumberSuffix}`;
    }

    private async navigateToMatchAnalysisPage(gameNumber: string) {
        try {
            await this.router.navigate(['/match-analysis'], { queryParams: { gameNumber } });
        } catch (error: any) {
            this.toastService.showError(error.message);
        }
    }
}
