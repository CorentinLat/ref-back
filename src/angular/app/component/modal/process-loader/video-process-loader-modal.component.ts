import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

import { DateTimeService } from '../../../service/DateTimeService';
import { ElectronService } from '../../../service/ElectronService';

@Component({ templateUrl: './process-loader-modal.component.html' })
export class VideoProcessLoaderModalComponent implements OnDestroy, OnInit {
    label?: string;
    progress = 0;
    remainingTime = Infinity;

    protected currentSubscription$!: Subscription;

    constructor(
        private readonly dateTimeService: DateTimeService,
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

    exposeRemainingTime = () => this.dateTimeService.getRemainingMinutes(this.remainingTime);

    handleCancelGameCreation() {
        this.electronService.cancelVideoProcess();
        this.modal.dismiss();
    }

    protected setCurrentSubscription() {
        this.currentSubscription$ = this.electronService.getProcessVideoProgress()
            .subscribe(({ label, percentage, remaining }) => this.zone.run(() => {
                this.label = label;
                this.progress = Math.round(percentage);
                this.remainingTime = remaining;
            }));
    }
}
