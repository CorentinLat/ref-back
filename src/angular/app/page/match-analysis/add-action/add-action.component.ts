import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
} from '../../../domain/game';

import CommunicationService from '../../../service/CommunicationService';
import { DateTimeService } from '../../../service/DateTimeService';
import { ToastService } from '../../../service/ToastService';

@Component({
    selector: 'app-add-action',
    templateUrl: './add-action.component.html',
    styleUrls: ['./add-action.component.scss']
})
export class AddActionComponent implements OnInit, OnDestroy {
    @Input() actions!: Action[];
    @Input() gameNumber!: string;
    @Input() videoApiService!: VgApiService;

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
    });

    private currentVideoTimeSubscription$!: Subscription;

    constructor(
        private communication: CommunicationService,
        private dateTimeService: DateTimeService,
        private toastService: ToastService,
    ) {}

    get secondControl(): FormControl { return this.addActionForm.get('second') as FormControl; }
    get typeControl(): FormControl { return this.addActionForm.get('type') as FormControl; }
    get cardControl(): FormControl { return this.addActionForm.get('card') as FormControl; }
    get againstControl(): FormControl { return this.addActionForm.get('against') as FormControl; }
    get sectorControl(): FormControl { return this.addActionForm.get('sector') as FormControl; }
    get faultControl(): FormControl { return this.addActionForm.get('fault') as FormControl; }
    get preciseControl(): FormControl { return this.addActionForm.get('precise') as FormControl; }

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
            .subscribe(() => this.secondControl.setValue(this.getCurrentVideoTime()));
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
        this.faultControl.setValue(this.actionFaults[this.actionSectors[0]]);
        this.preciseControl.setValue(this.actionPrecises[0]);
    }

    async handleSubmitAddAction(): Promise<void> {
        if (this.addActionForm.invalid) {
            return;
        }

        const newAction: NewAction = this.addActionForm.value;

        try {
            const action = await this.communication.addActionToGame(newAction, this.gameNumber);
            this.actions.push(action);
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
