import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Action, Game } from '../../domain/game';

import CommunicationService from '../../service/CommunicationService';
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

    constructor(
        private communication: CommunicationService,
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
        this.communication
            .getGameByNumber(this.gameNumber)
            .then(game => this.game = game)
            .catch(() => {
                this.toastService.showError('TOAST.ERROR.PROCESS_GAME_FAILED');
                this.navigateToHome();
            });
    }

    handleNavigateToMatchAnalysis(): void {
        this.router.navigate(
            ['/match-analysis'],
            { queryParams: { gameNumber: this.gameNumber} }
        );
    }

    async handleDownloadVideo(): Promise<void> {
        this.isDownloadingVideo = true;

        try {
            await this.communication.downloadVideoGame(this.gameNumber);
        } catch (error: any) {
            if (!error?.closed) {
                this.toastService.showError('TOAST.ERROR.PROCESS_DOWNLOAD_GAME_FAILED');
            }
        } finally {
            this.isDownloadingVideo = false;
        }
    }

    handleExportSummary(): void {}

    handleNavigateToHome(): void {
        this.navigateToHome();
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
