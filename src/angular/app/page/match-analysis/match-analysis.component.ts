import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

import { Game } from '../../../../../type/refBack';

import { ElectronService } from '../../service/ElectronService';
import { MatchAnalysisService } from '../../service/MatchAnalysisService';
import { NavigationService } from '../../service/NavigationService';
import { ToastService } from '../../service/ToastService';
import { VideoViewerService } from '../../service/VideoViewerService';

import { VideoEditorModalComponent } from '../../component/modal/video-editor-modal/video-editor-modal.component';

@Component({
    selector: 'app-match-analysis',
    templateUrl: './match-analysis.component.html',
    styleUrls: ['./match-analysis.component.scss'],
})
export class MatchAnalysisComponent implements OnInit, OnDestroy {
    public originPath: string|null = null;

    public game!: Game;
    public gameNumber!: string;

    public videoApiService!: VgApiService;

    public isCollapsed: boolean;

    private editVideoMediaSubscription$?: Subscription;
    private isCollapsedUpdatedSubscription$?: Subscription;

    constructor(
        private readonly cdr: ChangeDetectorRef,
        private readonly electron: ElectronService,
        private readonly modalService: NgbModal,
        private readonly matchAnalysisService: MatchAnalysisService,
        private readonly navigation: NavigationService,
        public readonly route: ActivatedRoute,
        private readonly toastService: ToastService,
        private readonly videoViewerService: VideoViewerService,
    ) {
        this.isCollapsed = this.matchAnalysisService.isCollapsed;
    }

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

        this.editVideoMediaSubscription$ = this.videoViewerService.videoMediaEdit.subscribe(() => this.handleOpenGameVideoEditorModal());
        this.isCollapsedUpdatedSubscription$ = this.matchAnalysisService.isCollapsedUpdated.subscribe(isCollapsed => this.isCollapsed = isCollapsed);
    }

    ngOnDestroy() {
        this.editVideoMediaSubscription$?.unsubscribe();
        this.isCollapsedUpdatedSubscription$?.unsubscribe();
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
                this.videoViewerService.refreshVideoMedia(newPath);
            },
            () => {}
        );
    }
}
