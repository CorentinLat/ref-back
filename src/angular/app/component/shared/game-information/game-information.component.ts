import { Component, Input } from '@angular/core';

import { Game } from '../../../../../../type/refBack';

@Component({
    selector: 'app-game-information',
    templateUrl: './game-information.component.html',
    styleUrls: ['./game-information.component.scss'],
})
export class GameInformationComponent {
    @Input() game?: Game;
}
