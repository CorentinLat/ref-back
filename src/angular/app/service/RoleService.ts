import { Injectable } from '@angular/core';

type Role = 'referee' | 'adviser';

@Injectable({ providedIn: 'root' })
export class RoleService {
    private _role: Role = 'referee';

    get role(): Role {
        return this._role;
    }

    public toggleRole(): void {
        this._role = this._role === 'referee' ? 'adviser' : 'referee';
    }
}
