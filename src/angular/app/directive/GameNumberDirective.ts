import { Directive, HostListener } from '@angular/core';

@Directive({ selector: '[game-number]' })
export default class GameNumberDirective {
    private readonly gameNumberLength = 12;
    private readonly spaceIndexToInclude = [2, 7];

    @HostListener('input', ['$event'])
    onInputChange(event: InputEvent) {
        const input = event.target as HTMLInputElement;

        if (event.inputType.startsWith('insert')) {
            if (this.spaceIndexToInclude.includes(input.value.length)) {
                input.value += ' ';
            } else if (this.spaceIndexToInclude.includes(input.value.length - 1)) {
                input.value = input.value.slice(0, -1);
                input.value += ` ${event.data}`;
            } else if (input.value.length > this.gameNumberLength) {
                input.value = input.value.slice(0, 12);
            }
        } else if (event.inputType.startsWith('delete')) {
            if (
                this.spaceIndexToInclude.includes(input.value.length) ||
                this.spaceIndexToInclude.includes(input.value.length - 1)
            ) {
                input.value = input.value.slice(0, -1);
            }
        }
    }
}
