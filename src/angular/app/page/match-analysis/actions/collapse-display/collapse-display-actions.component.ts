import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';

import { Action } from '../../../../domain/game';

import { DateTimeService } from '../../../../service/DateTimeService';

import { VideoEditorModalComponent } from '../../../../component/modal/video-editor-modal/video-editor-modal.component';

@Component({
  selector: 'app-collapse-display-actions',
  templateUrl: './collapse-display-actions.component.html',
  styleUrls: ['./collapse-display-actions.component.scss']
})
export class CollapseDisplayActionsComponent implements OnInit, OnDestroy {
    @Input() actions!: Action[];
    @Input() video!: { title: string; path: string };

    @Input() newActionAdded!: Observable<Action>;

    @Input() putVideoAtSecond!: (second: number) => void;

    @ViewChild('scrollable') scrollable!: ElementRef;

    private readonly actionHeightPx = 100;
    private readonly gapPx = 14;
    private readonly topMarginPx = 20;

    private newActionSubscription!: Subscription;

    constructor(
        private dateTimeService: DateTimeService,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.newActionSubscription = this.newActionAdded.subscribe(action => {
            const index = this.actions.findIndex(({ id }) => id === action.id);
            const actionPosition = Math.max(
                index * this.actionHeightPx + Math.max(index - 1, 0) * this.gapPx - this.topMarginPx,
                0
            );

            this.scrollable.nativeElement.scroll({ top: actionPosition, behavior: 'smooth' });
        });
    }

    ngOnDestroy(): void {
        this.newActionSubscription.unsubscribe();
    }

    handleOpenGameVideoEditorModal() {
        const modalRef = this.modalService.open(VideoEditorModalComponent, { fullscreen: true });
        modalRef.componentInstance.videoTitle = this.video.title;
        modalRef.componentInstance.videoPath = this.video.path;
    }

    exposeActionMinutes(second: number): string {
        return this.dateTimeService.convertSecondsToMMSS(second);
    }
}
