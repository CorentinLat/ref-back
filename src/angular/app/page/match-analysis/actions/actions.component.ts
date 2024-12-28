import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';

import { Action } from '../../../domain/game';

@Component({
    selector: 'app-actions',
    templateUrl: './actions.component.html',
    styleUrls: ['./actions.component.scss']
})
export class ActionsComponent {
    @Input() actions!: Action[];
    @Input() collapsed!: boolean;
    @Input() gameNumber!: string;

    @Input() newActionAdded!: Observable<Action>;

    @Input() putVideoAtSecond!: (second: number) => void;

    @Output() editVideo = new EventEmitter<void>();

    exposeActionsSortedByTime(): Action[] {
        return this.actions.sort((a, b) => a.second - b.second);
    }
}
