import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-match-analysis',
    templateUrl: './match-analysis.component.html',
    styleUrls: ['./match-analysis.component.scss'],
})
export class MatchAnalysisComponent implements OnInit {
    public gameNumber: string|null = null;
    public videoPath: SafeResourceUrl|null = null;

    constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) {}

    ngOnInit(): void {
        const videoPath = this.route.snapshot.queryParamMap.get('videoPath');
        this.gameNumber = this.route.snapshot.queryParamMap.get('gameNumber');
        this.videoPath = this.sanitizer.bypassSecurityTrustResourceUrl(`video://${videoPath}`);
    }
}
