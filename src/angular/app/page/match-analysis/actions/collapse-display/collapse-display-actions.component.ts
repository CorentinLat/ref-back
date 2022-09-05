import { Component, Input } from '@angular/core';

import { Action } from '../../../../domain/game';

import { DateTimeService } from '../../../../service/DateTimeService';

@Component({
  selector: 'app-collapse-display-actions',
  templateUrl: './collapse-display-actions.component.html',
  styleUrls: ['./collapse-display-actions.component.scss']
})
export class CollapseDisplayActionsComponent {
    @Input() actions!: Action[];

    @Input() putVideoAtSecond!: (second: number) => void;

    constructor(private dateTimeService: DateTimeService) {}

    exposeActionMinutes(second: number): string {
        return this.dateTimeService.convertSecondsToMMSS(second);
    }
}
