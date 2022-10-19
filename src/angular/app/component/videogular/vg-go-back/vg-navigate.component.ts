import { Component, HostListener, Input, ViewEncapsulation } from '@angular/core';
import { VgApiService } from '@videogular/ngx-videogular/core';

@Component({
    selector: 'app-vg-navigate',
    encapsulation: ViewEncapsulation.None,
    template: `
        <section
            class="icon"
            [class.vg-icon-replay_10]="is10Backward()"
            [class.vg-icon-replay_30]="is30Backward()"
            [class.vg-icon-forward_10]="is10Forward()"
            [class.vg-icon-forward_30]="is30Forward()"
        ></section>`,
    styles: [`
        app-vg-navigate {
            user-select: none;
            display: flex;
            justify-content: center;
            height: 50px;
            width: 30px;
            cursor: pointer;
            color: white;
            line-height: 50px;
        }

        app-vg-navigate .icon {
            pointer-events: none;
        }
    `]
})
export class VgNavigateComponent {
    @Input() time = 10;
    @Input() vgApi!: VgApiService;

    @HostListener('click')
    onClick() {
        this.goBack();
    }

    goBack() {
        this.vgApi.seekTime(this.vgApi.currentTime + this.time);
    }

    is10Backward() { return this.time === -10; }
    is30Backward() { return this.time === -30; }
    is10Forward() { return this.time === 10; }
    is30Forward() { return this.time === 30; }
}
