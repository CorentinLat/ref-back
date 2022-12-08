import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
} from '../../../../domain/game';

import { DateTimeService } from '../../../../service/DateTimeService';
import { ElectronService } from '../../../../service/ElectronService';
import { ToastService } from '../../../../service/ToastService';

@Component({
    selector: 'app-add-edit-action',
    templateUrl: './add-edit-action.component.html',
    styleUrls: ['./add-edit-action.component.scss'],
})
export class AddEditActionComponent implements OnInit, OnDestroy {
    @Input() gameNumber!: string;
    @Input() videoApiService!: VgApiService;

    @Output() actionSubmitted = new EventEmitter<Action|null>();

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
    isAddingAction = false;

    private currentVideoTimeSubscription$!: Subscription;

    constructor(
        private dateTimeService: DateTimeService,
        private electron: ElectronService,
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

        this.initActionForm();
    }

    ngOnDestroy(): void {
        this.currentVideoTimeSubscription$.unsubscribe();
    }

    exposeActionMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.secondControl.value);
    exposeDisplayCardInput = (): boolean => this.actionCardTypes.includes(this.typeControl.value);
    exposeFaultOptions = (): string[] => this.actionFaults[this.sectorControl.value];
    exposeEndClipMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.endClipControl.value);
    exposeStartClipMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.startClipControl.value);

    handleSectorChange = (): void => this.faultControl.setValue(this.actionFaults[this.sectorControl.value][0]);

    async handleSubmitAddAction(): Promise<void> {
        if (this.addActionForm.invalid) {
            return;
        }

        const newAction: NewAction = this.addActionForm.value;
        if (!this.createClip) {
            delete newAction.clip;
        }

        let action: Action|null = null;
        try {
            action = await this.electron.addActionToGame(newAction, this.gameNumber);
            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_ACTION_ADD_SUCCESS');
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_ADD_FAILED');
        } finally {
            this.actionSubmitted.emit(action);
        }
    }

    private initActionForm(): void {
        this.secondControl.setValue(this.getCurrentVideoTime());
        this.typeControl.setValue(this.actionTypes[0]);
        this.cardControl.setValue('');
        this.againstControl.setValue(this.actionAgainsts[0]);
        this.sectorControl.setValue(this.actionSectors[0]);
        this.faultControl.setValue(this.actionFaults[this.actionSectors[0]][0]);
        this.preciseControl.setValue(this.actionPrecises[0]);

        this.startClipControl.setValue(this.getCurrentVideoTime());
        this.endClipControl.setValue(this.getCurrentVideoTime() + 5);
    }

    private getCurrentVideoTime = (): number => this.videoApiService.currentTime;
}
