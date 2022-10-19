import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

import {
    Action,
    NewAction,
    actionAgainsts,
    actionCardTypes,
    actionCards,
    actionFaults,
    actionSectors,
    actionTypes,
    actionPrecises,
} from '../../../domain/game';

import { ElectronService } from '../../../service/ElectronService';
import { DateTimeService } from '../../../service/DateTimeService';
import { ToastService } from '../../../service/ToastService';

@Component({
    selector: 'app-add-action',
    templateUrl: './add-action.component.html',
    styleUrls: ['./add-action.component.scss']
})
export class AddActionComponent implements OnInit, OnDestroy {
    @Input() gameNumber!: string;
    @Input() videoApiService!: VgApiService;

    @Output() actionAdded = new EventEmitter<Action>();

    displayAddActionForm = false;
    isAddingAction = false;

    addActionForm = new FormGroup({
        second: new FormControl('', [Validators.required]),
        type: new FormControl('', [Validators.required]),
        card: new FormControl(),
        against: new FormControl('', [Validators.required]),
        sector: new FormControl('', [Validators.required]),
        fault: new FormControl('', [Validators.required]),
        precise: new FormControl('', [Validators.required]),
        comment: new FormControl(),
        clip: new FormGroup({
            start: new FormControl('', [Validators.required]),
            end: new FormControl('', [Validators.required]),
        }),
    });

    createClip = false;

    private currentVideoTimeSubscription$!: Subscription;

    constructor(
        private electron: ElectronService,
        private dateTimeService: DateTimeService,
        private router: Router,
        private toastService: ToastService,
    ) {}

    get secondControl(): FormControl { return this.addActionForm.get('second') as FormControl; }
    get typeControl(): FormControl { return this.addActionForm.get('type') as FormControl; }
    get cardControl(): FormControl { return this.addActionForm.get('card') as FormControl; }
    get againstControl(): FormControl { return this.addActionForm.get('against') as FormControl; }
    get sectorControl(): FormControl { return this.addActionForm.get('sector') as FormControl; }
    get faultControl(): FormControl { return this.addActionForm.get('fault') as FormControl; }
    get preciseControl(): FormControl { return this.addActionForm.get('precise') as FormControl; }
    get clipGroup(): FormGroup { return this.addActionForm.get('clip') as FormGroup; }
    get startClipControl(): FormControl { return this.clipGroup.get('start') as FormControl; }
    get endClipControl(): FormControl { return this.clipGroup.get('end') as FormControl; }

    get actionAgainsts(): string[] { return actionAgainsts; }
    get actionCardTypes(): string[] { return actionCardTypes; }
    get actionCards(): string[] { return actionCards; }
    get actionFaults(): { [sector: string]: string[] } { return actionFaults; }
    get actionSectors(): string[] { return actionSectors; }
    get actionTypes(): string[] { return actionTypes; }
    get actionPrecises(): string[] { return actionPrecises; }

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
    }

    ngOnDestroy(): void {
        this.currentVideoTimeSubscription$.unsubscribe();
    }

    exposeDisplayCardInput(): boolean {
        return this.actionCardTypes.includes(this.typeControl.value);
    }

    handleSectorChange(): void {
        this.faultControl.setValue(this.actionFaults[this.sectorControl.value][0]);
    }

    exposeFaultOptions(): string[] {
        return this.actionFaults[this.sectorControl.value];
    }

    exposeActionMinutes(): string {
        return this.dateTimeService.convertSecondsToMMSS(this.secondControl.value);
    }

    exposeStartClipMinutes(): string {
        return this.dateTimeService.convertSecondsToMMSS(this.startClipControl.value);
    }

    exposeEndClipMinutes(): string {
        return this.dateTimeService.convertSecondsToMMSS(this.endClipControl.value);
    }

    handleHideAddActionForm(): void {
        this.displayAddActionForm = false;
        this.addActionForm.reset();
    }

    handleDisplayAddActionForm(): void {
        this.displayAddActionForm = true;

        this.addActionForm.reset();
        this.secondControl.setValue(this.getCurrentVideoTime());
        this.typeControl.setValue(this.actionTypes[0]);
        this.cardControl.setValue('');
        this.againstControl.setValue(this.actionAgainsts[0]);
        this.sectorControl.setValue(this.actionSectors[0]);
        this.faultControl.setValue(this.actionFaults[this.actionSectors[0]][0]);
        this.preciseControl.setValue(this.actionPrecises[0]);

        this.createClip = false;
        this.startClipControl.setValue(this.getCurrentVideoTime());
        this.endClipControl.setValue(this.getCurrentVideoTime() + 5);
    }

    handleNavigateToSummary(): void {
        this.router.navigate(['/summary'], { queryParams: { gameNumber: this.gameNumber } });
    }

    async handleSubmitAddAction(): Promise<void> {
        if (this.addActionForm.invalid) {
            return;
        }

        const newAction: NewAction = this.addActionForm.value;
        if (!this.createClip) {
            delete newAction.clip;
        }

        try {
            const action = await this.electron.addActionToGame(newAction, this.gameNumber);
            this.actionAdded.emit(action);
            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_ACTION_ADD_SUCCESS');
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_ADD_FAILED');
        } finally {
            this.handleHideAddActionForm();
        }
    }

    private getCurrentVideoTime(): number {
        return this.videoApiService.currentTime;
    }
}
