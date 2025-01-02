import {
    Component,
    ElementRef,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { Action, Annotation, isAction, isAnnotation } from '../../../../../../../type/refBack';

import { ElectronService } from '../../../../service/ElectronService';
import { MatchAnalysisService } from '../../../../service/MatchAnalysisService';
import { ToastService } from '../../../../service/ToastService';
import { VideoViewerService } from '../../../../service/VideoViewerService';

@Component({
    selector: 'app-full-display-annotations',
    templateUrl: './full-display-actions.component.html',
    styleUrls: ['./full-display-actions.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class FullDisplayActionsComponent implements OnInit, OnDestroy {
    @Input() annotations!: (Action | Annotation)[];
    @Input() gameNumber!: string;

    @Input() isSummaryDisplay = false;
    @Input() sector: string | null = null;

    @ViewChild('scrollable') scrollable!: ElementRef;

    protected readonly isAction = isAction;
    protected readonly isAnnotation = isAnnotation;

    private readonly annotationHeightPx = 59;
    private readonly topMarginPx = 10;

    private newAnnotationSubscription?: Subscription;

    constructor(
        private readonly electron: ElectronService,
        private readonly matchAnalysisService: MatchAnalysisService,
        private readonly toastService: ToastService,
        private readonly videoViewerService: VideoViewerService,
    ) {}

    ngOnInit(): void {
        this.newAnnotationSubscription = this.matchAnalysisService.annotationAdded.subscribe(annotation => {
            const index = this.annotations.findIndex(({ id }) => id === annotation.id);
            const annotationPosition = Math.max(index * this.annotationHeightPx - this.topMarginPx, 0);

            this.scrollable.nativeElement.scroll({ top: annotationPosition, behavior: 'smooth' });
        });
    }

    ngOnDestroy(): void {
        this.newAnnotationSubscription?.unsubscribe();
    }

    handleEditVideoMedia = () => this.videoViewerService.editVideoMedia();

    exposeIsBySectorDisplay(): boolean {
        return this.sector !== null;
    }

    exposeAnnotations(): (Action|Annotation)[] {
        return this.annotations.reduce<(Action|Annotation)[]>((acc, annotation) => {
            if (this.exposeIsBySectorDisplay()) {
                if (isAction(annotation) && annotation.sector === this.sector) {
                    acc.push(annotation);
                }
            } else {
                acc.push(annotation);
            }

            return acc;
        }, []);
    }

    async removeAnnotation(annotationId: string): Promise<void> {
        if (this.isSummaryDisplay) return;

        const annotationIndex = this.annotations.findIndex(action => action.id === annotationId);
        if (annotationIndex === -1) return;

        try {
            await this.electron.removeActionFromGame(annotationId, this.gameNumber);
            this.annotations.splice(annotationIndex, 1);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_REMOVED');
        }
    }
}
