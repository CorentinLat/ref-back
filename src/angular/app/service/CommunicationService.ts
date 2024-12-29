import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Action } from '../../../../type/refBack';

@Injectable({ providedIn: 'root' })
export class CommunicationService {
    editAction = new Subject<Action>();
}
