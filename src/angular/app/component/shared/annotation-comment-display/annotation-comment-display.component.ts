import { Component, Input } from '@angular/core';

import { Role } from '../../../../../../type/refBack';

@Component({
  selector: 'app-annotation-comment-display',
  templateUrl: './annotation-comment-display.component.html',
  styleUrls: ['./annotation-comment-display.component.scss']
})
export class AnnotationCommentDisplayComponent {
    @Input() comment!: string;
    @Input() role!: Role;
    @Input() isInline = false;
}
