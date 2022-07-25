import { Component, HostBinding } from '@angular/core';

import { ToastService } from '../../service/ToastService';

@Component({ selector: 'app-toasts', templateUrl: './toasts.component.html' })
export class ToastsComponent {
    @HostBinding('class') class = 'toasts-container position-fixed top-0 end-0 p-3';
    @HostBinding('style') style = 'z-index: 1200';

    constructor(public toastService: ToastService) {}
}
