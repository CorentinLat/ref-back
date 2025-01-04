import { Component, NgZone } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { DateTimeService } from '../../../service/DateTimeService';
import { ElectronService } from '../../../service/ElectronService';

import { VideoProcessLoaderModalComponent } from './video-process-loader-modal.component';

@Component({ templateUrl: './process-loader-modal.component.html' })
export class ClipProcessLoaderModalComponent extends VideoProcessLoaderModalComponent {
    private clips: { [clip: string]: { percentage: number; remaining: number } } = {};

    constructor(
        dateTimeService: DateTimeService,
        electronService: ElectronService,
        modal: NgbActiveModal,
        zone: NgZone
    ) {
        super(dateTimeService, electronService, modal, zone);
    }

    protected setCurrentSubscription(): void {
        this.currentSubscription$ = this.electronService.getProcessClipProgress()
            .subscribe(({ clip, percentage, remaining }) => this.zone.run(() => {
                this.clips[clip] = { percentage, remaining };

                this.updateLoaderValues();
            }));
    }

    private updateLoaderValues(): void {
        const clipsDataSorted = Object.values(this.clips)
            .sort((a, b) => a.percentage - b.percentage);
        if (!clipsDataSorted.length) { return; }

        const { percentage, remaining } = clipsDataSorted[0];
        this.progress = Math.round(percentage);
        this.remainingTime = remaining;
    }
}
