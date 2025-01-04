import { Component, Input } from '@angular/core';

@Component({ selector: 'app-card', templateUrl: './card.component.html' })
export class CardComponent {
    @Input() card?: 'WARNING' | 'RED' | 'YELLOW' | 'WHITE';
}
