import { Component, HostListener, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { VideoCommandHelperModalComponent } from '../../modal/video-command-helper/video-command-helper-modal.component';

@Component({
    selector: 'app-vg-help',
    encapsulation: ViewEncapsulation.None,
    template: `<article class="icon">?</article>`,
    styles: [`
        app-vg-help {
            font-family: var(--bs-body-font-family), sans-serif;
            color: white;

            display: flex;
            align-items: center;
            justify-content: center;

            height: 50px;
            width: 30px;
            margin-left: 15px;

            cursor: pointer;
            user-select: none;
        }

        app-vg-help .icon {
            border: 2px solid white;
            border-radius: 50%;
            height: 24px;
            width: 24px;
            text-align: center;
            font-size: 14px;
        }
    `]
})
export class VgHelpComponent {
    constructor(private modalService: NgbModal) {}

    @HostListener('click')
    onClick() {
        this.modalService.open(VideoCommandHelperModalComponent, { backdrop: 'static', centered: true });
    }
}
