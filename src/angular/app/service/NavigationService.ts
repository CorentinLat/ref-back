import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';

import { ToastService } from './ToastService';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    constructor(private router: Router, private toastService: ToastService) {}

    public navigateTo = async (path: string, queryParams?: Params) => {
        try {
            await this.router.navigate([path], { queryParams });
        } catch (error: any) {
            this.toastService.showError(error.message);
        }
    };
}
