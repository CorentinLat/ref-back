import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Role }  from '../../../../type/refBack';

@Injectable({ providedIn: 'root' })
export class RoleService {
    public roleUpdated = new Subject<Role>();

    private _role: Role = 'referee';

    get role(): Role {
        return this._role;
    }

    public toggleRole(): void {
        this._role = this._role === 'referee' ? 'adviser' : 'referee';

        this.roleUpdated.next(this._role);
    }
}
