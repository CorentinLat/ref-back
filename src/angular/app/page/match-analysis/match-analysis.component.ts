import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { VgApiService } from '@videogular/ngx-videogular/core';

import { Game } from '../../domain/game';

import CommunicationService from '../../service/CommunicationService';
import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-match-analysis',
    templateUrl: './match-analysis.component.html',
    styleUrls: ['./match-analysis.component.scss'],
})
export class MatchAnalysisComponent implements OnInit {
    public game!: Game;
    public gameNumber!: string|null;
    public videoPath!: SafeResourceUrl;

    public videoApiService!: VgApiService;

    public areActionsCollapsed = true;

    constructor(
        private cdr: ChangeDetectorRef,
        private communication: CommunicationService,
        private route: ActivatedRoute,
        private router: Router,
        private sanitizer: DomSanitizer,
        private toastService: ToastService,
    ) {}

    ngOnInit(): void {
        this.gameNumber = this.route.snapshot.queryParamMap.get('gameNumber');
        if (!this.gameNumber) {
            this.navigateToHome();
            return;
        }

        this.communication
            .getGameByNumber(this.gameNumber)
            .then(game => {
                this.game = game;
                this.videoPath = this.sanitizer.bypassSecurityTrustResourceUrl(`video://${game.information.videoPath}`);
            })
            .catch(() => {
                this.toastService.showError('TOAST.ERROR.PROCESS_GAME_FAILED');
                this.navigateToHome();
            });
    }

    public onPlayerReady = (api: VgApiService): void => {
        this.videoApiService = api;
        this.cdr.detectChanges();
    };

    public putVideoAtSecond = (second: number): void => {
        this.videoApiService.getDefaultMedia().currentTime = second;
    };

    private navigateToHome(): void {
        this.router.navigate(['/']);
    }
}
