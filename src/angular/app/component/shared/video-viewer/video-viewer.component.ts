import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-video-viewer',
    templateUrl: './video-viewer.component.html',
})
export class VideoViewerComponent implements OnInit, OnDestroy {
    @Input() videoPath!: string;
    @Input() timing?: number;

    @Output() videoReady = new EventEmitter<{ currentTime: number; vgApiService: VgApiService }>();
    @Output() videoPaused = new EventEmitter<number>();
    @Output() videoPlayed = new EventEmitter<number>();
    @Output() videoTimeUpdated = new EventEmitter<number>();

    videoApiService!: VgApiService;
    videoPathSafe!: SafeResourceUrl;

    private mediaPauseSubscription$?: Subscription;
    private mediaPlaySubscription$?: Subscription;
    private mediaTimeUpdatedSubscription$?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
    ) {}

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.videoApiService?.isPlayerReady || (event.target as HTMLElement)?.tagName === 'TEXTAREA') {
            return;
        }
        event.preventDefault();

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
        event.preventDefault();

        if (event.deltaX > 0) {
            this.handleVideoTimeChange(event, false);
        } else {
            this.handleVideoTimeChange(event, true);
        }
    }

    ngOnInit(): void {
        this.videoPathSafe = this.sanitizer.bypassSecurityTrustResourceUrl(`video://${this.videoPath}`);
    }

    ngOnDestroy(): void {
        this.mediaPauseSubscription$?.unsubscribe();
        this.mediaPlaySubscription$?.unsubscribe();
        this.mediaTimeUpdatedSubscription$?.unsubscribe();
    }

    onPlayerReady = (api: VgApiService): void => {
        this.videoApiService = api;
        this.videoApiService.volume = 0;
        this.putVideoAtSecond(this.timing);

        this.mediaPauseSubscription$ = this.videoApiService.getDefaultMedia().subscriptions
            .pause.subscribe((e) => this.videoPaused.emit(e.target.currentTime));
        this.mediaPlaySubscription$ = this.videoApiService.getDefaultMedia().subscriptions
            .play.subscribe((e) => this.videoPlayed.emit(e.target.currentTime));
        this.mediaTimeUpdatedSubscription$ = this.videoApiService.getDefaultMedia().subscriptions
            .timeUpdate.subscribe((e) => this.videoTimeUpdated.emit(e.target.currentTime));

        this.videoReady.emit({ currentTime: this.videoApiService.currentTime, vgApiService: this.videoApiService });
        this.cdr.detectChanges();
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

    private putVideoAtSecond = (second: number = 0): void => {
        this.videoApiService.getDefaultMedia().currentTime = second;
    };
}
