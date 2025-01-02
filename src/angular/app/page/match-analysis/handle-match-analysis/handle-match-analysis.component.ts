import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { Subscription } from 'rxjs';

import { Action, Annotation, Game, isAction, isAnnotation, Role } from '../../../../../../type/refBack';

import { MatchAnalysisService } from '../../../service/MatchAnalysisService';

@Component({
    selector: 'app-handle-match-analysis',
    templateUrl: './handle-match-analysis.component.html',
    styleUrls: ['./handle-match-analysis.component.scss']
})
export class HandleMatchAnalysisComponent implements OnInit, OnDestroy {
    @Input() game!: Game;
    @Input() videoApiService!: VgApiService;

    currentAction?: Action;
    displayActionForm = false;
    currentAnnotation?: Annotation;
    displayAnnotationForm = false;

    isCollapsed: boolean;
    role: Role;

    private editActionSubscription$?: Subscription;

    constructor(private readonly matchAnalysisService: MatchAnalysisService) {
        this.isCollapsed = this.matchAnalysisService.isCollapsed;
        this.role = this.matchAnalysisService.role;
    }

    ngOnInit() {
        this.editActionSubscription$ = this.matchAnalysisService.annotationEdited.subscribe(annotation => {
            if (isAction(annotation)) {
                this.currentAction = annotation;
                this.handleDisplayActionForm();
            } else if (isAnnotation(annotation)) {
                this.currentAnnotation = annotation;
                this.handleDisplayAnnotationForm();
            }
        });
    }

    ngOnDestroy() {
        this.editActionSubscription$?.unsubscribe();
    }

    handleDisplayActionForm = () => this.displayActionForm = true;
    handleDisplayAnnotationForm = () => this.displayAnnotationForm = true;
    handleToggleRole = () => this.matchAnalysisService.toggleRole();

    handleToggleCollapse() {
        this.isCollapsed = !this.isCollapsed;

        this.matchAnalysisService.toggleCollapsed();
    }

    handleAnnotationAdded(annotation: Action|Annotation): void {
        this.game.actions.push(annotation);
        this.game.actions = this.game.actions.sort((a, b) => a.second - b.second);
        this.matchAnalysisService.addAnnotation(annotation);
        this.handleHideForms();
    }

    handleAnnotationEdited(annotation: Action|Annotation): void {
        this.currentAction = undefined;
        this.game.actions = this.game.actions.filter(({ id }) => id !== annotation.id);
        this.handleAnnotationAdded(annotation);
    }

    handleActionCancelled(): void {
        this.handleHideForms();
    }

    private handleHideForms(): void {
        this.currentAction = undefined;
        this.displayActionForm = false;

        this.currentAnnotation = undefined;
        this.displayAnnotationForm = false;
    }
}
