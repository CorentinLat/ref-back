import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subject } from 'rxjs';

import { Action, Game } from '../../domain/game';

import { ElectronService } from '../../service/ElectronService';
import { NavigationService } from '../../service/NavigationService';
import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-match-analysis',
    templateUrl: './match-analysis.component.html',
    styleUrls: ['./match-analysis.component.scss'],
})
export class MatchAnalysisComponent implements OnInit {
    public originPath: string|null = null;

    public game!: Game;
    public gameNumber!: string;
    public video!: { title: string; path: string };

    public videoApiService!: VgApiService;

    public collapse = { actions: true };

    public newActionAdded = new Subject<Action>();

    constructor(
        private cdr: ChangeDetectorRef,
        private electron: ElectronService,
        private navigation: NavigationService,
        public route: ActivatedRoute,
        private toastService: ToastService,
    ) {}

    ngOnInit(): void {
        const gameNumber = this.route.snapshot.queryParamMap.get('gameNumber');
        if (!gameNumber) {
            this.handleNavigateToOriginOrHome();
            return;
        }
        this.originPath = this.route.snapshot.queryParamMap.get('originPath');

        this.gameNumber = gameNumber;
        this.electron
            .getGameByNumber(this.gameNumber)
            .then(game => {
                this.game = game;
                this.video = {
                    title: `${this.game.information.date} - ${this.game.information.teams.local} - ${this.game.information.teams.visitor}`,
                    path: this.game.information.videoPath,
                };
            })
            .catch(() => {
                this.toastService.showError('TOAST.ERROR.PROCESS_GAME');
                this.handleNavigateToOriginOrHome();
            });
    }

    public handleNavigateToOriginOrHome = () => this.navigation.navigateTo(this.originPath || '/');
    public handleNavigateToSummary = () => this.navigation.navigateTo('/summary', { gameNumber: this.game.information.gameNumber });

    public handleVideoReady = ({ vgApiService }: { vgApiService: VgApiService }): void => {
        this.videoApiService = vgApiService;

        this.cdr.detectChanges();
    };

    public putVideoAtSecond = (second: number): void => {
        this.videoApiService.getDefaultMedia().currentTime = second;
    };

    public onActionAdded = (action: Action): void => {
        setTimeout(() => this.newActionAdded.next(action), 100);
    };
}
