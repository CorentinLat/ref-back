import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Action, Annotation, Role } from '../../../../type/refBack';

@Injectable({ providedIn: 'root' })
export class MatchAnalysisService {
    public annotationAdded = new Subject<Action|Annotation>();
    public annotationEdited = new Subject<Action|Annotation>();

    public isCollapsedUpdated = new Subject<boolean>();
    public roleUpdated = new Subject<Role>();

    private _isCollapsed = true;
    private _role: Role = 'referee';

    get isCollapsed(): boolean { return this._isCollapsed; }
    get role(): Role { return this._role; }

    public addAnnotation = (annotation: Action|Annotation) => this.annotationAdded.next(annotation);
    public editAnnotation = (annotation: Action|Annotation) => this.annotationEdited.next(annotation);

    public toggleCollapsed(): void {
        this._isCollapsed = !this._isCollapsed;

        this.isCollapsedUpdated.next(this._isCollapsed);
    }

    public toggleRole(): void {
        this._role = this._role === 'referee' ? 'adviser' : 'referee';

        this.roleUpdated.next(this._role);
    }
}
