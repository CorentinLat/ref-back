import { Component, Input } from '@angular/core';

import { Action } from '../../../../../../type/refBack';

@Component({
  selector: 'app-action-comments-display',
  templateUrl: './action-comments-display.component.html',
  styleUrls: ['./action-comments-display.component.scss']
})
export class ActionCommentsDisplayComponent {
    @Input() action!: Action;
    @Input() inline = false;
}
