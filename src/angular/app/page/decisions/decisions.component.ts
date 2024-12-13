import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// import { ElectronService } from '../../service/ElectronService';
// import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-home',
    templateUrl: './decisions.component.html',
    styleUrls: ['./decisions.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class DecisionsComponent implements OnInit {
    searchForm = new FormGroup({
        sectors: new FormControl([], []),
    });

    isProcessingVideos = false;

    constructor(
        // private electron: ElectronService,
        // private modalService: NgbModal,
        private router: Router,
        // private toastService: ToastService,
    ) {}

    get sectorsControl(): FormControl { return this.searchForm.get('sectors') as FormControl; }

    ngOnInit() {
    }

    exposeClassNameForFormControl(formControl: FormControl): string {
        return !formControl || formControl.pristine || formControl.valid
            ? 'form-control'
            : 'form-control is-invalid';
    }

    exposeFormControlHasError(formControl: FormControl, error: string): boolean {
        return formControl.dirty && formControl.hasError(error);
    }

    exposeFormGroupIsInvalid(formGroup: FormGroup): boolean {
        const isFormGroupDirty = Object.values(formGroup.controls).every(control => control.dirty);
        return isFormGroupDirty && formGroup.invalid;
    }

    async searchDecisions() {
        if (this.searchForm.invalid) {
            return;
        }
    }

    async navigateToHomePage() {
        await this.router.navigate(['/']);
    }

    // private async navigateToMatchAnalysisPage(gameNumber: string) {
    //     try {
    //         await this.router.navigate(['/match-analysis'], { queryParams: { gameNumber } });
    //     } catch (error: any) {
    //         this.toastService.showError(error.message);
    //     }
    // }
}
