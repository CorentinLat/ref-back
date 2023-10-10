import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

import { ElectronService } from '../../../service/ElectronService';

@Component({ templateUrl: './process-loader-modal.component.html' })
export class VideoProcessLoaderModalComponent implements OnDestroy, OnInit {
    progress = 0;
    remainingTime = Infinity;

    protected currentSubscription$!: Subscription;

    constructor(
        protected electronService: ElectronService,
        public modal: NgbActiveModal,
        protected zone: NgZone
    ) {}

    ngOnInit(): void {
        this.setCurrentSubscription();
    }

    ngOnDestroy() {
        this.currentSubscription$?.unsubscribe();
    }

    exposeRemainingTime(): string {
        const minutes = Math.floor(this.remainingTime / 60);
        if (!Number.isFinite(minutes)) {
            return '...';
        }

        return minutes === 0
            ? `< 1m`
            : `${minutes}m`;
    }

    handleCancelGameCreation() {
        this.electronService.cancelVideoProcess();
        this.modal.dismiss();
    }

    protected setCurrentSubscription() {
        this.currentSubscription$ = this.electronService.getProcessVideoProgress()
            .subscribe(({ percentage, remaining }) => this.zone.run(() => {
                this.progress = Math.round(percentage);
                this.remainingTime = remaining;
            }));
    }
}
