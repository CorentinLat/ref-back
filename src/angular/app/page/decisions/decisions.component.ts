import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Subscription } from 'rxjs';

import { Decision } from '../../../../../type/refBack';

import { actionFaults, actionPrecises, ActionSector, actionSectors } from '../../domain/game';

import { ElectronService } from '../../service/ElectronService';
import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-decisions',
    templateUrl: './decisions.component.html',
    styleUrls: ['./decisions.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class DecisionsComponent implements OnDestroy, OnInit {
    searchForm = new FormGroup({
        faults: new FormControl([], []),
        sectors: new FormControl([], []),
        precises: new FormControl([], []),
    });

    allDecisions: Decision[] = [];
    filteredDecisions: Decision[] = [];

    isLoadingDecisions = false;

    private sectorsControlChangeSubscription$?: Subscription;

    constructor(
        private electron: ElectronService,
        // private modalService: NgbModal,
        private router: Router,
        private toastService: ToastService,
        private translate: TranslateService,
    ) {}

    get multiSelectDropdownDefaultSettings(): IDropdownSettings {
        return {
            singleSelection: false,
            enableCheckAll: false,
            selectAllText: this.translate.instant('PAGE.DECISIONS.FORM.MULTI_SELECT.ALL'),
            unSelectAllText: this.translate.instant('PAGE.DECISIONS.FORM.MULTI_SELECT.NONE'),
            itemsShowLimit: 2,
            allowSearchFilter: false,
            maxHeight: 400,
            idField: 'id',
            textField: 'name',
        };
    }

    get multiSelectDropdownFaultsSettings(): IDropdownSettings {
        return {
            ...this.multiSelectDropdownDefaultSettings,
            allowSearchFilter: true,
            noDataAvailablePlaceholderText: this.translate.instant('PAGE.DECISIONS.FORM.MULTI_SELECT.NO_DATA_FAULT'),
            searchPlaceholderText: this.translate.instant('PAGE.DECISIONS.FORM.MULTI_SELECT.SEARCH'),
        };
    }

    get multiSelectDropdownPrecisesSettings(): IDropdownSettings {
        return {
            ...this.multiSelectDropdownDefaultSettings,
            itemsShowLimit: 3,
        };
    }

    get faultsControl(): FormControl { return this.searchForm.get('faults') as FormControl; }
    get precisesControl(): FormControl { return this.searchForm.get('precises') as FormControl; }
    get sectorsControl(): FormControl { return this.searchForm.get('sectors') as FormControl; }

    get actionSectors(): { id: string; name: string }[] {
        return actionSectors
            .map(sector => ({
                id: sector,
                name: this.translate.instant(`PAGE.MATCH_ANALYSIS.ACTIONS.ACTION.SECTOR.${sector}`),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
    get actionFaults(): { id: string; name: string }[] {
        return this.getFaultsForCurrentSectors();
    }
    get actionPrecises(): { id: string; name: string }[] {
        return actionPrecises
            .map(precise => ({
                id: precise,
                name: this.translate.instant(`PAGE.MATCH_ANALYSIS.ACTIONS.ACTION.PRECISE.${precise}`),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    ngOnInit() {
        this.sectorsControlChangeSubscription$ = this.sectorsControl.valueChanges.subscribe(() => {
            this.faultsControl.setValue(
                this.faultsControl.value.filter(
                    ({ id }: { id: string }) =>
                        this.actionFaults.some(fault => fault.id === id)
                )
            );
        });

        this.getAllDecisions()
            .then(() => this.filterDecisions());
    }

    ngOnDestroy() {
        this.sectorsControlChangeSubscription$?.unsubscribe();
    }

    filterDecisions() {
        if (this.searchForm.invalid) return;

        const { sectors, faults, precises }: { faults: string[]; sectors: string[]; precises: string[] } = {
            sectors: this.sectorsControl.value.map(({ id }: { id: string }) => id),
            faults: this.faultsControl.value.map(({ id }: { id: string }) => id),
            precises: this.precisesControl.value.map(({ id }: { id: string }) => id),
        };

        let filteredDecisions = [...this.allDecisions];
        if (sectors.length) filteredDecisions = filteredDecisions.filter(decision => sectors.includes(decision.sector));
        if (faults.length) filteredDecisions = filteredDecisions.filter(decision => faults.includes(decision.fault));
        if (precises.length) filteredDecisions = filteredDecisions.filter(decision => precises.includes(decision.precise));

        this.filteredDecisions = filteredDecisions;
    }

    async navigateToHomePage() {
        try {
            await this.router.navigate(['/']);
        } catch (error: any) {
            this.toastService.showError(error.message);
        }
    }

    async navigateToMatchAnalysisPage(gameNumber: string) {
        try {
            await this.router.navigate(['/match-analysis'], { queryParams: { gameNumber } });
        } catch (error: any) {
            this.toastService.showError(error.message);
        }
    }

    private async getAllDecisions() {
        this.isLoadingDecisions = true;

        try {
            this.allDecisions = await this.electron.getDecisions();
        } catch (error: any) {
            this.allDecisions = [];
            this.toastService.showError('TOAST.ERROR.PROCESS_DECISIONS');
        } finally {
            this.isLoadingDecisions = false;
        }
    }

    private getFaultsForCurrentSectors(): { id: string; name: string }[] {
        const allFaults: string [] = this.sectorsControl.value
            .map((sector: { id: ActionSector }) => actionFaults[sector.id])
            .flat(Infinity);

        return Array.from(new Set(allFaults))
            .map(fault => ({
                id: fault,
                name: this.translate.instant(`PAGE.MATCH_ANALYSIS.ACTIONS.ACTION.FAULT.${fault}`),
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
}
