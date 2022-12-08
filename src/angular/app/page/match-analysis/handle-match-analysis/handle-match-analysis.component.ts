import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

import { Action, Game } from '../../../domain/game';

import { CommunicationService } from '../../../service/CommunicationService';
// import { ElectronService } from '../../../service/ElectronService';
// import { ToastService } from '../../../service/ToastService';

@Component({
    selector: 'app-handle-match-analysis',
    templateUrl: './handle-match-analysis.component.html',
    styleUrls: ['./handle-match-analysis.component.scss']
})
export class HandleMatchAnalysisComponent implements OnInit, OnDestroy {
    @Input() game!: Game;
    @Input() videoApiService!: VgApiService;

    @Output() actionAdded = new EventEmitter<Action>();

    currentAction?: Action;
    displayActionForm = false;

    private editActionSubscription$?: Subscription;

    constructor(
        private communicationService: CommunicationService,
        private router: Router,
        // private electron: ElectronService,
        // private toastService: ToastService,
    ) {}

    ngOnInit() {
        this.editActionSubscription$ = this.communicationService.editAction.subscribe(action => {
            this.currentAction = action;
            this.handleDisplayActionForm();
        });
    }

    ngOnDestroy() {
        this.editActionSubscription$?.unsubscribe();
    }

    handleDisplayActionForm(): void {
        this.displayActionForm = true;
    }

    handleNavigateToSummary(): void {
        this.router.navigate(
            ['/summary'],
            { queryParams: { gameNumber: this.game.information.gameNumber } }
        );
    }

    handleActionAdded(action: Action): void {
        this.game.actions.push(action);
        this.game.actions = this.game.actions.sort((a, b) => a.second - b.second);
        this.actionAdded.emit(action);
        this.handleHideActionForm();
    }

    handleActionEdited(action: Action): void {
        this.currentAction = undefined;
        this.game.actions = this.game.actions.filter(({ id }) => id !== action.id);
        this.handleActionAdded(action);
    }

    handleActionCancelled(): void {
        this.handleHideActionForm();
    }

    private handleHideActionForm(): void {
        this.currentAction = undefined;
        this.displayActionForm = false;
    }
}
