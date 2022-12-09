import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subject } from 'rxjs';

import { Action, Game } from '../../domain/game';

import { ElectronService } from '../../service/ElectronService';
import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-match-analysis',
    templateUrl: './match-analysis.component.html',
    styleUrls: ['./match-analysis.component.scss'],
})
export class MatchAnalysisComponent implements OnInit {
    public game!: Game;
    public gameNumber!: string;
    public videoPath!: SafeResourceUrl;

    public videoApiService!: VgApiService;

    public collapse = { actions: true };

    public newActionAdded = new Subject<Action>();

    constructor(
        private cdr: ChangeDetectorRef,
        private electron: ElectronService,
        private route: ActivatedRoute,
        private router: Router,
        private sanitizer: DomSanitizer,
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
            .then(game => {
                this.game = game;
                this.videoPath = this.sanitizer.bypassSecurityTrustResourceUrl(`video://${game.information.videoPath}`);
            })
            .catch(() => {
                this.toastService.showError('TOAST.ERROR.PROCESS_GAME');
                this.navigateToHome();
            });
    }

    public onPlayerReady = (api: VgApiService): void => {
        this.videoApiService = api;
        this.videoApiService.volume = 0;

        this.cdr.detectChanges();
    };

    public putVideoAtSecond = (second: number): void => {
        this.videoApiService.getDefaultMedia().currentTime = second;
    };

    public onActionAdded = (action: Action): void => {
        setTimeout(() => this.newActionAdded.next(action), 100);
    };

    private navigateToHome(): void {
        this.router.navigate(['/']);
    }
}
