import { ChangeDetectorRef, Component, OnInit, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
    public game!: Game;
    public gameNumber!: string;
    public videoPath!: SafeResourceUrl;
    public originPath: string|null = null;

    public videoApiService!: VgApiService;

    public collapse = { actions: true };

    public newActionAdded = new Subject<Action>();

    constructor(
        private cdr: ChangeDetectorRef,
        private electron: ElectronService,
        private navigation: NavigationService,
        private route: ActivatedRoute,
        private sanitizer: DomSanitizer,
        private toastService: ToastService,
    ) {}

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.videoApiService?.isPlayerReady || (event.target as HTMLElement)?.tagName === 'TEXTAREA') {
            return;
        }

        if (event.code === 'Space') {
            this.toggleVideoPlayPause();
        } else if (event.code === 'ArrowLeft') {
            this.handleVideoTimeChange(event, false);
        } else if (event.code === 'ArrowRight') {
            this.handleVideoTimeChange(event, true);
        } else if (event.key.toLowerCase() === 'f') {
            this.toggleFullscreen();
        } else if (event.key.toLowerCase() === 'm') {
            this.toggleVideoMute();
        }
    }

    @HostListener('document:mousewheel', ['$event'])
    handleMouseWheelEvent(event: WheelEvent) {
        if (!this.videoApiService?.isPlayerReady) return;
        if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) return;

        if (event.deltaX > 0) {
            this.handleVideoTimeChange(event, false);
        } else {
            this.handleVideoTimeChange(event, true);
        }
    }

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
                this.videoPath = this.sanitizer.bypassSecurityTrustResourceUrl(`video://${game.information.videoPath}`);
            })
            .catch(() => {
                this.toastService.showError('TOAST.ERROR.PROCESS_GAME');
                this.handleNavigateToOriginOrHome();
            });
    }

    public handleNavigateToOriginOrHome = () => this.navigation.navigateTo(this.originPath || '/');
    public handleNavigateToSummary = () => this.navigation.navigateTo('/summary', { gameNumber: this.game.information.gameNumber });

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

    private toggleVideoPlayPause = (): void => {
        if (this.videoApiService.state === 'paused') {
            this.videoApiService.play();
        } else {
            this.videoApiService.pause();
        }
    };

    private handleVideoTimeChange = (event: KeyboardEvent | WheelEvent, isForward = false): void => {
        const delay = event.altKey ? 30
            : event.shiftKey ? 10
                : 1;
        const multiplier = isForward ? 1 : -1;

        this.putVideoAtSecond(this.videoApiService.currentTime + delay * multiplier);
    };

    private toggleFullscreen = (): void => {
        this.videoApiService.fsAPI.toggleFullscreen();
    };

    private toggleVideoMute = (): void => {
        this.videoApiService.volume = this.videoApiService.volume === 0 ? 1 : 0;
    };
}
