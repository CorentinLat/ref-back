import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

import { AnnotationForm, Annotation, NewAnnotation, isAnnotation } from '../../../../../../../type/refBack';

import { DateTimeService } from '../../../../service/DateTimeService';
import { ElectronService } from '../../../../service/ElectronService';
import { MatchAnalysisService } from '../../../../service/MatchAnalysisService';
import { ToastService } from '../../../../service/ToastService';

@Component({
    selector: 'app-add-edit-annotation',
    templateUrl: './add-edit-annotation.component.html',
    styleUrls: ['./add-edit-annotation.component.scss'],
})
export class AddEditAnnotationComponent implements OnInit, OnDestroy {
    @Input() annotation?: Annotation;
    @Input() gameNumber!: string;
    @Input() videoApiService!: VgApiService;

    @Output() annotationAdded = new EventEmitter<Annotation>();
    @Output() annotationEdited = new EventEmitter<Annotation>();
    @Output() annotationCancelled = new EventEmitter();

    annotationForm = new FormGroup({
        second: new FormControl('', [Validators.required]),
        comment: new FormControl(),
        clip: new FormGroup({
            start: new FormControl('', [Validators.required]),
            end: new FormControl('', [Validators.required]),
        }),
    });
    createClip = false;
    isSubmittingAnnotation = false;

    private currentVideoTimeSubscription$?: Subscription;
    private editAnnotationSubscription$?: Subscription;
    private roleUpdatedSubscription$?: Subscription;

    constructor(
        private readonly dateTimeService: DateTimeService,
        private readonly electron: ElectronService,
        private readonly matchAnalysisService: MatchAnalysisService,
        private readonly toastService: ToastService,
    ) {}

    get secondControl(): FormControl { return this.annotationForm.get('second') as FormControl; }
    get commentControl(): FormControl { return this.annotationForm.get('comment') as FormControl; }
    get clipGroup(): FormGroup { return this.annotationForm.get('clip') as FormGroup; }
    get startClipControl(): FormControl { return this.clipGroup.get('start') as FormControl; }
    get endClipControl(): FormControl { return this.clipGroup.get('end') as FormControl; }

    get role() { return this.matchAnalysisService.role; }

    ngOnInit(): void {
        this.currentVideoTimeSubscription$ = this.videoApiService.getDefaultMedia()
            .subscriptions.timeUpdate
            .subscribe(() => {
                const currentTime = this.getCurrentVideoTime();

                if (!this.createClip || this.videoApiService.state === 'paused') {
                    this.secondControl.setValue(currentTime);
                    this.startClipControl.setValue(currentTime);
                    if (this.endClipControl.value < currentTime) {
                        this.endClipControl.setValue(currentTime + 5);
                    }
                } else if (this.createClip && this.videoApiService.state === 'playing') {
                    this.endClipControl.setValue(currentTime);
                }
            });
        this.editAnnotationSubscription$ = this.matchAnalysisService.annotationEdited.subscribe(annotation => {
            if (isAnnotation(annotation)) {
                this.annotation = annotation;
                this.fillAnnotationForm();
            }
        });
        this.roleUpdatedSubscription$ = this.matchAnalysisService.roleUpdated.subscribe(role => {
            if (this.annotation) {
                this.commentControl.setValue(role === 'referee' ? this.annotation.comment : this.annotation.commentFromAdviser);
            }
        });

        this.fillAnnotationForm();
    }

    ngOnDestroy(): void {
        this.currentVideoTimeSubscription$?.unsubscribe();
        this.editAnnotationSubscription$?.unsubscribe();
        this.roleUpdatedSubscription$?.unsubscribe();
    }

    exposeAnnotationMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.secondControl.value);
    exposeEndClipMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.endClipControl.value);
    exposeStartClipMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.startClipControl.value);

    isNotCreatorRole(): boolean {
        if (!this.annotation) return false;

        if (this.annotation.fromAdviser && this.matchAnalysisService.role === 'adviser') return false;
        if (!this.annotation.fromAdviser && this.matchAnalysisService.role === 'referee') return false;

        return true;
    }

    async handleAnnotationSubmitted(): Promise<void> {
        if (this.annotationForm.invalid) {return;}

        const newAnnotation: AnnotationForm = this.annotationForm.value;

        if (!this.createClip) { delete newAnnotation.clip; }

        return this.annotation ? this.editAnnotation(newAnnotation) : this.addAnnotation(newAnnotation);
    }

    private fillAnnotationForm(): void {
        this.secondControl.setValue(this.annotation ? this.annotation.second : this.getCurrentVideoTime());
        this.commentControl.setValue(this.annotation ? (this.role === 'referee' ? this.annotation.comment : this.annotation.commentFromAdviser) : '');
        this.startClipControl.setValue(this.annotation?.clip?.start ? this.annotation.clip.start : this.getCurrentVideoTime());
        this.endClipControl.setValue(this.annotation?.clip?.end ? this.annotation.clip.end : this.getCurrentVideoTime() + 5);

        this.createClip = this.annotation?.clip !== undefined;
    }

    private getCurrentVideoTime = (): number => this.videoApiService.currentTime;

    private async addAnnotation(annotationForm: AnnotationForm): Promise<void> {
        const newAnnotation: NewAnnotation = {
            ...annotationForm,
            comment: this.role === 'referee' ? annotationForm.comment : undefined,
            commentFromAdviser: this.role === 'adviser' ? annotationForm.comment : undefined,
            fromAdviser: this.role === 'adviser',
        };

        try {
            const annotationCreated = await this.electron.addAnnotationToGame<Annotation>(newAnnotation, this.gameNumber);
            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_ACTION_ADDED');
            this.annotationAdded.emit(annotationCreated);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_ADDED');
            this.annotationCancelled.emit();
        }
    }

    private async editAnnotation(annotationForm: AnnotationForm): Promise<void> {
        if (!this.annotation) return;

        const annotationToEdit: Annotation = {
            id: this.annotation.id,
            ...annotationForm,
            comment: this.role === 'referee' ? annotationForm.comment : this.annotation.comment,
            commentFromAdviser: this.role === 'adviser' ? annotationForm.comment : this.annotation.commentFromAdviser,
            fromAdviser: this.annotation.fromAdviser,
        };

        try {
            const annotationEdited = await this.electron.editAnnotationFromGame(annotationToEdit, this.gameNumber);
            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_ACTION_EDITED');
            this.annotationEdited.emit(annotationEdited);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_EDITED');
            this.annotationCancelled.emit();
        }
    }
}
