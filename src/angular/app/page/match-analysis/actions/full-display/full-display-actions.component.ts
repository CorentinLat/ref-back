import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { Action } from '../../../../domain/game';

import { ElectronService } from '../../../../service/ElectronService';
import { ToastService } from '../../../../service/ToastService';

@Component({
  selector: 'app-full-display-actions',
  templateUrl: './full-display-actions.component.html',
  styleUrls: ['./full-display-actions.component.scss']
})
export class FullDisplayActionsComponent implements OnInit, OnDestroy {
    @Input() actions!: Action[];
    @Input() gameNumber!: string;

    @Input() isSummaryDisplay = false;
    @Input() sector: string|null = null;

    @Input() newActionAdded?: Observable<Action>;

    @Input() putVideoAtSecond!: (second: number) => void;

    @Output() editVideo = new EventEmitter<void>();

    @ViewChild('scrollable') scrollable!: ElementRef;

    private readonly actionHeightPx = 59;
    private readonly topMarginPx = 10;

    private newActionSubscription?: Subscription;

    constructor(
        private electron: ElectronService,
        private toastService: ToastService,
    ) {}

    ngOnInit(): void {
        this.newActionSubscription = this.newActionAdded?.subscribe(action => {
            const index = this.actions.findIndex(({ id }) => id === action.id);
            const actionPosition = Math.max(index * this.actionHeightPx - this.topMarginPx, 0);

            this.scrollable.nativeElement.scroll({ top: actionPosition, behavior: 'smooth' });
        });
    }

    ngOnDestroy(): void {
        this.newActionSubscription?.unsubscribe();
    }

    exposeIsBySectorDisplay(): boolean {
        return this.sector !== null;
    }

    exposeActions(): Action[] {
        return this.exposeIsBySectorDisplay()
            ? this.actions.filter(({ sector }) => sector === this.sector)
            : this.actions;
    }

    async removeAction(actionId: string): Promise<void> {
        if (this.isSummaryDisplay) { return; }

        const actionIndex = this.actions.findIndex(action => action.id === actionId);
        if (actionIndex === -1) { return; }

        try {
            await this.electron.removeActionFromGame(actionId, this.gameNumber);
            this.actions.splice(actionIndex, 1);
        } catch (_) {
            this.toastService.showError('TOAST.ERROR.PROCESS_ACTION_REMOVED');
        }
    }
}
