import { Component, Input } from '@angular/core';

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

    @Input() putVideoAtSecond!: (second: number) => void;

    exposeActionsSortedByTime(): Action[] {
        return this.actions.sort((a, b) => a.second - b.second);
    }
}
