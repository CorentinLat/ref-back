import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

import { Action, ActionForm, NewAction } from '../../../../../../../type/refBack';

import {
    actionAgainsts,
    actionCardTypes,
    actionCards,
    actionFaults,
    actionSectors,
    actionTypes,
    actionPrecises,
} from '../../../../domain/game';

import { CommunicationService } from '../../../../service/CommunicationService';
import { DateTimeService } from '../../../../service/DateTimeService';
import { ElectronService } from '../../../../service/ElectronService';
import { RoleService } from '../../../../service/RoleService';
import { ToastService } from '../../../../service/ToastService';

@Component({
    selector: 'app-add-edit-action',
    templateUrl: './add-edit-action.component.html',
    styleUrls: ['./add-edit-action.component.scss'],
})
export class AddEditActionComponent implements OnInit, OnDestroy {
    @Input() action?: Action;
    @Input() gameNumber!: string;
    @Input() videoApiService!: VgApiService;

    @Output() actionAdded = new EventEmitter<Action>();
    @Output() actionEdited = new EventEmitter<Action>();
    @Output() actionCancelled = new EventEmitter();

    actionForm = new FormGroup({
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
    isSubmittingAction = false;

    private currentVideoTimeSubscription$?: Subscription;
    private editActionSubscription$?: Subscription;
    private roleUpdatedSubscription$?: Subscription;

    constructor(
        private readonly communicationService: CommunicationService,
        private readonly dateTimeService: DateTimeService,
        private readonly electron: ElectronService,
        private readonly roleService: RoleService,
        private readonly toastService: ToastService,
    ) {}

    get secondControl(): FormControl { return this.actionForm.get('second') as FormControl; }
    get typeControl(): FormControl { return this.actionForm.get('type') as FormControl; }
    get cardControl(): FormControl { return this.actionForm.get('card') as FormControl; }
    get againstControl(): FormControl { return this.actionForm.get('against') as FormControl; }
    get sectorControl(): FormControl { return this.actionForm.get('sector') as FormControl; }
    get faultControl(): FormControl { return this.actionForm.get('fault') as FormControl; }
    get preciseControl(): FormControl { return this.actionForm.get('precise') as FormControl; }
    get commentControl(): FormControl { return this.actionForm.get('comment') as FormControl; }
    get clipGroup(): FormGroup { return this.actionForm.get('clip') as FormGroup; }
    get startClipControl(): FormControl { return this.clipGroup.get('start') as FormControl; }
    get endClipControl(): FormControl { return this.clipGroup.get('end') as FormControl; }

    get actionAgainsts(): string[] { return actionAgainsts; }
    get actionCardTypes(): string[] { return actionCardTypes; }
    get actionCards(): string[] { return actionCards; }
    get actionFaults(): { [sector: string]: string[] } { return actionFaults; }
    get actionSectors(): string[] { return actionSectors; }
    get actionTypes(): string[] { return actionTypes; }
    get actionPrecises(): string[] { return actionPrecises; }

    get role() { return this.roleService.role; }

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
        this.editActionSubscription$ = this.communicationService.editAction.subscribe(action => {
            this.action = action;
            this.fillActionForm();
        });
        this.roleUpdatedSubscription$ = this.roleService.roleUpdated.subscribe(role => {
            if (this.action) {
                this.commentControl.setValue(role === 'referee' ? this.action.comment : this.action.commentFromAdviser);
            }
        });

        this.fillActionForm();
    }

    ngOnDestroy(): void {
        this.currentVideoTimeSubscription$?.unsubscribe();
        this.editActionSubscription$?.unsubscribe();
        this.roleUpdatedSubscription$?.unsubscribe();
    }

    exposeActionMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.secondControl.value);
    exposeDisplayCardInput = (): boolean => this.actionCardTypes.includes(this.typeControl.value);
    exposeFaultOptions = (): string[] => this.actionFaults[this.sectorControl.value];
    exposeEndClipMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.endClipControl.value);
    exposeStartClipMinutes = (): string => this.dateTimeService.convertSecondsToMMSS(this.startClipControl.value);

    handleSectorChange = (): void => this.faultControl.setValue(this.actionFaults[this.sectorControl.value][0]);

    async handleActionSubmitted(): Promise<void> {
        if (this.actionForm.invalid) {return;}

        const newAction: ActionForm = this.actionForm.value;

        if (!this.exposeDisplayCardInput()) { delete newAction.card; }
        if (!this.createClip) { delete newAction.clip; }

        return this.action ? this.editAction(newAction) : this.addAction(newAction);
    }

    private fillActionForm(): void {
        this.secondControl.setValue(this.action ? this.action.second : this.getCurrentVideoTime());
        this.typeControl.setValue(this.action ? this.action.type : this.actionTypes[0]);
        this.cardControl.setValue(this.action ? this.action.card : '');
        this.againstControl.setValue(this.action ? this.action.against : this.actionAgainsts[0]);
        this.sectorControl.setValue(this.action ? this.action.sector : this.actionSectors[0]);
        this.faultControl.setValue(this.action ? this.action.fault : this.actionFaults[this.actionSectors[0]][0]);
        this.preciseControl.setValue(this.action ? this.action.precise : this.actionPrecises[0]);
        this.commentControl.setValue(this.action ? (this.role === 'referee' ? this.action.comment : this.action.commentFromAdviser) : '');
        this.startClipControl.setValue(this.action?.clip?.start ? this.action.clip.start : this.getCurrentVideoTime());
        this.endClipControl.setValue(this.action?.clip?.end ? this.action.clip.end : this.getCurrentVideoTime() + 5);

        this.createClip = this.action?.clip !== undefined;
    }

    private getCurrentVideoTime = (): number => this.videoApiService.currentTime;

    private async addAction(actionForm: ActionForm): Promise<void> {
        const newAction: NewAction = {
            ...actionForm,
            comment: this.role === 'referee' ? actionForm.comment : undefined,
            commentFromAdviser: this.role === 'adviser' ? actionForm.comment : undefined,
            fromAdviser: this.role === 'adviser',
        };

        try {
            const actionCreated = await this.electron.addActionToGame(newAction, this.gameNumber);
            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_ACTION_ADDED');
            this.actionAdded.emit(actionCreated);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_ADDED');
            this.actionCancelled.emit();
        }
    }

    private async editAction(actionForm: ActionForm): Promise<void> {
        if (!this.action) return;

        const actionToEdit: Action = {
            id: this.action.id,
            ...actionForm,
            comment: this.role === 'referee' ? actionForm.comment : this.action.comment,
            commentFromAdviser: this.role === 'adviser' ? actionForm.comment : this.action.commentFromAdviser,
            fromAdviser: this.action.fromAdviser,
        };

        try {
            const actionEdited = await this.electron.editActionFromGame(actionToEdit, this.gameNumber);
            this.toastService.showSuccess('TOAST.SUCCESS.PROCESS_ACTION_EDITED');
            this.actionEdited.emit(actionEdited);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_EDITED');
            this.actionCancelled.emit();
        }
    }
}
