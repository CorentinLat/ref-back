import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Action, Annotation, Game, isAction, SummaryExportType } from '../../../../../type/refBack';

import { ClipProcessLoaderModalComponent } from '../../component/modal/process-loader/clip-process-loader-modal.component';

import { ElectronService } from '../../service/ElectronService';
import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
    public game!: Game;
    public gameNumber!: string;

    public isDownloadingVideo = false;
    public isDownloadingSummary = false;

    constructor(
        private electron: ElectronService,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private router: Router,
        private toastService: ToastService,
    ) {}

    get actions(): Action[] {
        return this.game.actions.filter(isAction);
    }

    ngOnInit(): void {
        const gameNumber = this.route.snapshot.queryParamMap.get('gameNumber');
        if (!gameNumber) {
            this.navigateToHome();
            return;
        }

        this.gameNumber = gameNumber;
        this.electron
            .getGameByNumber(this.gameNumber)
            .then(game => this.game = game)
            .catch(() => {
                this.toastService.showError('TOAST.ERROR.PROCESS_GAME');
                this.navigateToHome();
            });
    }

    async handleNavigateToMatchAnalysis(): Promise<void> {
        try {
            await this.router.navigate(['/match-analysis'], { queryParams: { gameNumber: this.gameNumber} });
        } catch (error: any) {
            this.toastService.showError(error.message);
        }
    }

    async handleDownloadVideoGame(): Promise<void> {
        this.isDownloadingVideo = true;

        try {
            await this.electron.downloadVideoGame(this.gameNumber);
        } catch (error: any) {
            if (!error?.closed) {
                this.toastService.showError('TOAST.ERROR.PROCESS_DOWNLOAD_GAME');
            }
        } finally {
            this.isDownloadingVideo = false;
        }
    }

    async handleDownloadVideoClips(): Promise<void> {
        this.isDownloadingVideo = true;
        const modal = this.modalService.open(ClipProcessLoaderModalComponent, { backdrop: 'static', centered: true });

        try {
            await this.electron.downloadVideoClips(this.gameNumber);
        } catch (error: any) {
            if (error?.cancelled) {
                this.toastService.showInfo('TOAST.INFO.DOWNLOAD_VIDEO_CANCELLED');
            } else if (!error?.closed) {
                this.toastService.showError('TOAST.ERROR.PROCESS_DOWNLOAD_CLIPS');
            }
        } finally {
            this.isDownloadingVideo = false;
            modal.close();
        }
    }

    async handleDownloadVideoAll(): Promise<void> {
        this.isDownloadingVideo = true;
        const modal = this.modalService.open(ClipProcessLoaderModalComponent, { backdrop: 'static', centered: true });

        try {
            await this.electron.downloadAllVideos(this.gameNumber);
        } catch (error: any) {
            if (error?.cancelled) {
                this.toastService.showInfo('TOAST.INFO.DOWNLOAD_VIDEO_CANCELLED');
            } else if (!error?.closed) {
                this.toastService.showError('TOAST.ERROR.PROCESS_DOWNLOAD_VIDEOS');
            }
        } finally {
            this.isDownloadingVideo = false;
            modal.close();
        }
    }

    async handleExportSummary(exportType: SummaryExportType): Promise<void> {
        this.isDownloadingSummary = true;

        try {
            await this.electron.downloadSummary(this.gameNumber, exportType);
        } catch (error: any) {
            if (!error?.closed) {
                this.toastService.showError('TOAST.ERROR.PROCESS_DOWNLOAD_SUMMARY');
            }
        } finally {
            this.isDownloadingSummary = false;
        }
    }

    handleNavigateToHome(): void {
        this.navigateToHome();
    }

    exposeHasClips(): boolean {
        return this.game.actions.some(action => action.clip);
    }

    exposeHasAnnotations(): boolean {
        return Boolean(this.game?.actions?.length);
    }

    exposeHasStatistics(): boolean {
        return this.game.actions.some(action =>
            isAction(action) && (action.type === 'PENALTY' || action.type === 'FREE_KICK')
        );
    }

    exposeAnnotationsSortedByTime(): (Action|Annotation)[] {
        return this.game.actions.sort((a, b) => a.second - b.second);
    }

    exposeSectorsWithAtLeastOneAction(): string[] {
        const uniqueSectors = this.game.actions
            .reduce<Set<string>>((sectors, action) => {
                if(isAction(action)) sectors.add(action.sector);
                return sectors;
            }, new Set());

        return Array
            .from(uniqueSectors)
            .sort((a, b) => a.localeCompare(b));
    }

    private async navigateToHome(): Promise<void> {
        try {
            await this.router.navigate(['/']);
        } catch (error: any) {
            this.toastService.showError(error.message);
        }
    }
}
