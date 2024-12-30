import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

import { Action, Game, Role } from '../../../../../../type/refBack';

import { CommunicationService } from '../../../service/CommunicationService';
import { RoleService } from '../../../service/RoleService';

@Component({
    selector: 'app-handle-match-analysis',
    templateUrl: './handle-match-analysis.component.html',
    styleUrls: ['./handle-match-analysis.component.scss']
})
export class HandleMatchAnalysisComponent implements OnInit, OnDestroy {
    @Input() collapse!: { actions: boolean };
    @Input() game!: Game;
    @Input() videoApiService!: VgApiService;

    @Output() actionAdded = new EventEmitter<Action>();

    currentAction?: Action;
    displayActionForm = false;
    role: Role;

    private editActionSubscription$?: Subscription;

    constructor(
        private readonly communicationService: CommunicationService,
        private readonly roleService: RoleService,
    ) {
        this.role = this.roleService.role;
    }

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

    handleToggleRole = () => this.roleService.toggleRole();

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
