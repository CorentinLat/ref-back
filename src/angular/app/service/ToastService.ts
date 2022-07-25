import { Injectable } from '@angular/core';

type Toast = { text: string; classname?: string; delay?: number };

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts: Toast[] = [];

    showInfo(text: string) {
        this.toasts.push({ text });
    }

    showSuccess(text: string) {
        this.toasts.push({ text, classname: 'bg-success text-light' });
    }

    showError(text: string) {
        this.toasts.push({ text, classname: 'bg-danger text-light' });
    }

    remove(toast: Toast) {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}
