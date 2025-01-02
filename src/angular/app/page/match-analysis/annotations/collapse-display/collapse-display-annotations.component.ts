import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { Action, Annotation } from '../../../../../../../type/refBack';

import { DateTimeService } from '../../../../service/DateTimeService';

@Component({
  selector: 'app-collapse-display-annotations',
  templateUrl: './collapse-display-annotations.component.html',
  styleUrls: ['./collapse-display-annotations.component.scss']
})
export class CollapseDisplayAnnotationsComponent implements OnInit, OnDestroy {
    @Input() annotations!: (Action|Annotation)[];

    @Input() newActionAdded!: Observable<Action>;

    @Input() putVideoAtSecond!: (second: number) => void;

    @Output() editVideo = new EventEmitter<void>();

    @ViewChild('scrollable') scrollable!: ElementRef;

    private readonly actionHeightPx = 100;
    private readonly gapPx = 14;
    private readonly topMarginPx = 20;

    private newActionSubscription!: Subscription;

    constructor(private dateTimeService: DateTimeService) {}

    ngOnInit(): void {
        this.newActionSubscription = this.newActionAdded.subscribe(action => {
            const index = this.annotations.findIndex(({ id }) => id === action.id);
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

    exposeActionMinutes(second: number): string {
        return this.dateTimeService.convertSecondsToMMSS(second);
    }
}
