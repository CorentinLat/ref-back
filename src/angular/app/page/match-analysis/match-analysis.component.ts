import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subject } from 'rxjs';

import { Action, Game } from '../../domain/game';

import { ElectronService } from '../../service/ElectronService';
import { NavigationService } from '../../service/NavigationService';
import { ToastService } from '../../service/ToastService';

import { VideoEditorModalComponent } from '../../component/modal/video-editor-modal/video-editor-modal.component';

@Component({
    selector: 'app-match-analysis',
    templateUrl: './match-analysis.component.html',
    styleUrls: ['./match-analysis.component.scss'],
})
export class MatchAnalysisComponent implements OnInit {
    public originPath: string|null = null;

    public game!: Game;
    public gameNumber!: string;

    public videoApiService!: VgApiService;

    public collapse = { actions: true };

    public newActionAdded = new Subject<Action>();
    public refreshVideoMedia = new Subject<string>();

    constructor(
        private cdr: ChangeDetectorRef,
        private electron: ElectronService,
        private modalService: NgbModal,
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

        this.gameNumber = gameNumber;
        this.originPath = this.route.snapshot.queryParamMap.get('originPath');

        this.electron
            .getGameByNumber(this.gameNumber)
            .then(game => this.game = game)
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

    handleOpenGameVideoEditorModal() {
        this.videoApiService.pause();

        const modalRef = this.modalService.open(VideoEditorModalComponent, { fullscreen: true });
        modalRef.componentInstance.videoTitle = `${this.game.information.date} - ${this.game.information.teams.local} - ${this.game.information.teams.visitor}`;
        modalRef.componentInstance.videoPath = this.game.information.videoPath;

        modalRef.result.then(
            (newPath: string) => {
                this.game.information.videoPath = newPath;
                this.refreshVideoMedia.next(newPath);
            },
            () => {}
        );
    }

    public putVideoAtSecond = (second: number): void => {
        this.videoApiService.getDefaultMedia().currentTime = second;
    };

    public onActionAdded = (action: Action): void => {
        setTimeout(() => this.newActionAdded.next(action), 100);
    };
}
