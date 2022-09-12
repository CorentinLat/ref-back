import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { Action } from '../../../domain/game';

type PieChartResults = { name: string; value: number }[];

@Component({ selector: 'app-summary-statistics', templateUrl: './statistics.component.html' })
export class StatisticsComponent implements OnInit {
    @Input() actions!: Action[];

    penaltyNumbersByTeams!: PieChartResults;
    freeKickNumbersByTeams!: PieChartResults;
    penaltyNumbersBySectors!: PieChartResults;
    freeKickNumbersBySectors!: PieChartResults;

    constructor(private translate: TranslateService) {}

    ngOnInit() {
        this.penaltyNumbersByTeams = this.computePenaltyNumbersByTeams();
        this.freeKickNumbersByTeams = this.computeFreeKickNumbersByTeams();
        this.penaltyNumbersBySectors = this.computePenaltyNumbersBySectors();
        this.freeKickNumbersBySectors = this.computeFreeKickNumbersBySectors();
    }

    formatAgainst = (against: string): string => this.translate.instant(`PAGE.SUMMARY.STATISTICS.AGAINST.${against}`);
    formatSector = (sector: string): string => this.translate.instant(`PAGE.SUMMARY.STATISTICS.SECTOR.${sector}`);

    private computePenaltyNumbersByTeams(): PieChartResults {
        const count = this.countDecisionByTeams('PENALTY');

        return Object.keys(count).map(team => ({ name: team, value: count[team] }));
    }

    private computeFreeKickNumbersByTeams(): PieChartResults {
        const count = this.countDecisionByTeams('FREE_KICK');

        return Object.keys(count).map(team => ({ name: team, value: count[team] }));
    }

    private computePenaltyNumbersBySectors(): PieChartResults {
        const count = this.countDecisionBySectors('PENALTY');

        return Object.keys(count).map(sector => ({ name: sector, value: count[sector] }));
    }

    private computeFreeKickNumbersBySectors(): PieChartResults {
        const count = this.countDecisionBySectors('FREE_KICK');

        return Object.keys(count).map(sector => ({ name: sector, value: count[sector] }));
    }

    private countDecisionByTeams(decision: string): { [team: string]: number } {
        return this.actions.reduce<{ [team: string]: number }>((teams, action) => {
            if (action.type === decision) {
                teams[action.against] = (teams[action.against] || 0) + 1;
            }

            return teams;
        }, {});
    }

    private countDecisionBySectors(decision: string): { [sector: string]: number } {
        return this.actions.reduce<{ [sector: string]: number }>((sectors, action) => {
            if (action.type === decision) {
                sectors[action.sector] = (sectors[action.sector] || 0) + 1;
            }

            return sectors;
        }, {});
    }
}
