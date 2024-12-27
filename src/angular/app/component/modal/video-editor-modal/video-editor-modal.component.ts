import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

import { DateTimeService } from '../../../service/DateTimeService';
import { ElectronService } from '../../../service/ElectronService';
import { ToastService } from '../../../service/ToastService';

@Component({
  selector: 'app-video-editor-modal',
  templateUrl: './video-editor-modal.component.html',
  styleUrls: ['./video-editor-modal.component.scss']
})
export class VideoEditorModalComponent implements OnInit, OnDestroy {
    @Input() videoTitle!: string;
    @Input() videoPath!: string;
    @Input() timing?: number;

    isClipEdition!: boolean;
    isEditing!: boolean;
    isEditionValid = false;
    isProcessingVideo = false;
    progress = 0;
    remainingTime = Infinity;

    videoService!: VgApiService;
    currentVideoTime!: number;
    clip = { begin: 0, end: 0 };
    game = { firstHalf: { begin: 0, end: 0 }, secondHalf: { begin: 0, end: 0 } };

    private currentSubscription$!: Subscription;

    constructor(
        private readonly dateTimeService: DateTimeService,
        private readonly electronService: ElectronService,
        private readonly toastService: ToastService,
        public modal: NgbActiveModal,
        protected zone: NgZone,
    ) {}

    ngOnInit(): void {
        this.isClipEdition = this.timing !== undefined;
        this.isEditing = !this.isClipEdition;

        this.currentSubscription$ = this.electronService.getProcessVideoProgress()
            .subscribe(({ percentage, remaining }) => this.zone.run(() => {
                this.progress = Math.round(percentage);
                this.remainingTime = remaining;
            }));
    }

    ngOnDestroy() {
        this.currentSubscription$?.unsubscribe();
    }

    handleVideoReady = ({ currentTime, vgApiService }: { currentTime: number; vgApiService: VgApiService }) => {
        this.currentVideoTime = currentTime;
        this.videoService = vgApiService;
    };

    handleVideoTimeUpdated = (currentTime: number) => {
        this.currentVideoTime = currentTime;

        if (this.isEditing && this.isClipEdition) {
            if (currentTime < this.clip.begin) {
                this.clip.end = this.clip.begin;
            } else {
                this.clip.end = currentTime;
            }

            this.checkEditionValidity();
        }
    };

    handleVideoPaused = () => {
        if (this.isEditing && this.isClipEdition) {
            if (this.clip.end < this.clip.begin) {
                this.clip.end = this.clip.begin;

                this.checkEditionValidity();
            }
        }
    };

    handleEditVideo = () => {
        this.isEditing = true;

        if (this.isClipEdition) {
            this.clip.begin = this.currentVideoTime;
            this.clip.end = this.currentVideoTime;
        }

        this.checkEditionValidity();
    };

    handleCancelEdit = () => {
        if (this.isClipEdition) {
            this.isEditing = false;
            this.isEditionValid = false;
        } else {
            this.modal.dismiss();
        }
    };

    handleUpdateClipBeginToCurrent = () => {
        if (this.isClipEdition) {
            this.clip.begin = this.currentVideoTime;
            if (this.clip.end < this.clip.begin) {
                this.clip.end = this.clip.begin;
            }

            this.checkEditionValidity();
        }
    };

    handleUpdateFirstHalfBeginToCurrent = () => {
        if (!this.isClipEdition) {
            this.game.firstHalf.begin = this.currentVideoTime;
            this.checkEditionValidity();
        }
    };

    handleUpdateFirstHalfEndToCurrent = () => {
        if (!this.isClipEdition) {
            this.game.firstHalf.end = this.currentVideoTime;
            this.checkEditionValidity();
        }
    };

    handleUpdateSecondHalfBeginToCurrent = () => {
        if (!this.isClipEdition) {
            this.game.secondHalf.begin = this.currentVideoTime;
            this.checkEditionValidity();
        }
    };

    handleUpdateSecondHalfEndToCurrent = () => {
        if (!this.isClipEdition) {
            this.game.secondHalf.end = this.currentVideoTime;
            this.checkEditionValidity();
        }
    };

    handleSubmitVideoProcessing = async () => {
        this.isProcessingVideo = true;
        this.videoService.pause();

        try {
            const cuts = this.isClipEdition
                ? [[this.clip.begin, this.clip.end]]
                : [[this.game.firstHalf.begin, this.game.firstHalf.end], [this.game.secondHalf.begin, this.game.secondHalf.end]];

            await this.electronService.cutVideo(this.videoPath, cuts, !this.isClipEdition);
            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_CUT_VIDEO');
            this.modal.close();
        } catch (error: any) {
            if (error?.cancelled) {
                this.toastService.showInfo('TOAST.INFO.CUT_VIDEO_CANCELLED');
            } else if (!error?.closed) {
                this.toastService.showError('TOAST.ERROR.PROCESS_CUT_VIDEO');
            }
        } finally {
            this.isProcessingVideo = false;
        }
    };

    handleCancelVideoProcessing = () => this.electronService.cancelVideoProcess();

    exposeRemainingTime = () => this.dateTimeService.getRemainingMinutes(this.remainingTime);
    exposeSecondToMMSS = (seconds: number) => this.dateTimeService.convertSecondsToMMSS(seconds);

    private checkEditionValidity = () => {
        if (this.isClipEdition) {
            this.isEditionValid = this.clip.end > this.clip.begin;
        } else {
            this.isEditionValid = this.game.firstHalf.begin < this.game.firstHalf.end
                && this.game.firstHalf.end <= this.game.secondHalf.begin
                && this.game.secondHalf.begin < this.game.secondHalf.end;
        }
    };
}
