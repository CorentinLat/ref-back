import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Action, Game } from '../../domain/game';

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

    handleNavigateToMatchAnalysis(): void {
        this.router.navigate(
            ['/match-analysis'],
            { queryParams: { gameNumber: this.gameNumber} }
        );
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

    async handleExportSummary(): Promise<void> {
        this.isDownloadingSummary = true;

        try {
            await this.electron.downloadPdfSummary(this.gameNumber);
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

    exposeHasDecisions(): boolean {
        return Boolean(this.game?.actions?.length);
    }

    exposeHasStatistics(): boolean {
        return this.game.actions.some(action =>
            action.type === 'PENALTY' || action.type === 'FREE_KICK'
        );
    }

    exposeActionsSortedByTime(): Action[] {
        return this.game.actions.sort((a, b) => a.second - b.second);
    }

    exposeSectorsWithAtLeastOneDecision(): string[] {
        const uniqueSectors = this.game.actions
            .reduce<Set<string>>((sectors, action) => {
                sectors.add(action.sector);
                return sectors;
            }, new Set());

        return Array
            .from(uniqueSectors)
            .sort((a, b) => a.localeCompare(b));
    }

    private navigateToHome(): void {
        this.router.navigate(['/']);
    }
}
