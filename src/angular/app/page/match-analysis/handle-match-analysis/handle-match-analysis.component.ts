import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { VgApiService } from '@videogular/ngx-videogular/core';

import { Action, Game } from '../../../domain/game';

// import { ElectronService } from '../../../service/ElectronService';
// import { ToastService } from '../../../service/ToastService';

@Component({
    selector: 'app-handle-match-analysis',
    templateUrl: './handle-match-analysis.component.html',
    styleUrls: ['./handle-match-analysis.component.scss']
})
export class HandleMatchAnalysisComponent {
    @Input() game!: Game;
    @Input() videoApiService!: VgApiService;

    @Output() actionAdded = new EventEmitter<Action>();

    displayAddActionForm = false;

    constructor(
        private router: Router,
        // private electron: ElectronService,
        // private toastService: ToastService,
    ) {}

    handleDisplayAddActionForm(): void {
        this.displayAddActionForm = true;
    }

    handleNavigateToSummary(): void {
        this.router.navigate(
            ['/summary'],
            { queryParams: { gameNumber: this.game.information.gameNumber } }
        );
    }

    handleActionSubmitted(action?: Action): void {
        this.handleHideAddActionForm();

        if (!action) {return;}

        this.game.actions.push(action);
        this.game.actions = this.game.actions.sort((a, b) => a.second - b.second);
        this.actionAdded.emit(action);
    }

    private handleHideAddActionForm(): void {
        this.displayAddActionForm = false;
    }
}
