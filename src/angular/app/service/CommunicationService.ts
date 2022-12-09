import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Action } from '../domain/game';

@Injectable({ providedIn: 'root' })
export class CommunicationService {
    editAction = new Subject<Action>();
}
