import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    template: `
        <section class="modal-body text-center">
            <button type="button" class="btn-close" (click)="modal.dismiss()"></button>

            <section class="d-flex align-items-center justify-content-center flex-row gap-4">
                <section class="d-flex flex-row gap-2">
                    <article style="text-align: right">
                        <p><span class="key">␣</span></p>
                        <p><span class="key">⏴</span></p>
                        <p><span class="key">⇧</span> + <span class="key">⏴</span></p>
                        <p><span class="key">⌥</span> + <span class="key">⏴</span></p>
                        <p><span class="key">⌃/⌘</span> + <span class="key">⏴</span></p>
                    </article>

                    <article style="text-align: left">
                        <p>Lecture / Pause</p>
                        <p>-1s</p>
                        <p>-10s</p>
                        <p>-30s</p>
                        <p>-1 image</p>
                    </article>
                </section>

                <section class="d-flex flex-row gap-2">
                    <article style="text-align: right">
                        <p>Son</p>
                        <p>+1s</p>
                        <p>+10s</p>
                        <p>+30s</p>
                        <p>+1 image</p>
                    </article>

                    <article style="text-align: left">
                        <p><span class="key">M</span></p>
                        <p><span class="key">⏵</span></p>
                        <p><span class="key">⇧</span> + <span class="key">⏵</span></p>
                        <p><span class="key">⌥</span> + <span class="key">⏵</span></p>
                        <p><span class="key">⌃/⌘</span> + <span class="key">⏵</span></p>
                    </article>
                </section>
            </section>
        </section>
    `,
    styles: [`
        .btn-close {
            position: absolute;
            top: 5px;
            right: 5px;
        }

        .key {
            color: white;
            border: 1px solid black;
            background-color: black;
            padding: 4px 8px;
            border-radius: 4px;
        }

        p { margin: 16px 0 }
    `]
})
export class VideoCommandHelperModalComponent {
    constructor(public modal: NgbActiveModal) {}
}
