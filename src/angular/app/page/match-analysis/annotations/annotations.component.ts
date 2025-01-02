import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';

import { Action, Annotation } from '../../../../../../type/refBack';

@Component({
    selector: 'app-annotations',
    templateUrl: './annotations.component.html',
    styleUrls: ['./annotations.component.scss']
})
export class AnnotationsComponent {
    @Input() annotations!: (Action|Annotation)[];
    @Input() collapsed!: boolean;
    @Input() gameNumber!: string;

    @Input() newActionAdded!: Observable<Action>;

    @Input() putVideoAtSecond!: (second: number) => void;

    @Output() editVideo = new EventEmitter<void>();

    exposeAnnotationsSortedByTime(): (Action|Annotation)[] {
        return this.annotations.sort((a, b) => a.second - b.second);
    }
}
