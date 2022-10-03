import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FfrService {
    private readonly meiliOptions = {
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'X-Meili-API-Key': '28867d0ba127ab4c4a629a682309c8b8eed9fb3514d9cf47d014fd9caefab4b0',
        },
    };

    constructor(private http: HttpClient) {}

    searchTeams(term: string): Observable<string[]> {
        if (term === '') {
            return of([]);
        }

        const clubsObservable = this.http
            .post<{ hits: { nom: string }[] }>(
                'https://commons-docker-meilisearch.ffr.nextmap.cloud/indexes/Competition-26/search',
                { filter: ['type=\'club\''], limit: 4, q: term },
                this.meiliOptions
            )
            .pipe(map(response => response.hits.map(hit => hit.nom)));
        const regroupementsObservable = this.http
            .post<{ hits: { nom: string }[] }>(
                'https://commons-docker-meilisearch.ffr.nextmap.cloud/indexes/Competition-26/search',
                { filter: ['type=\'regroupement\''], limit: 2, q: term },
                this.meiliOptions
            )
            .pipe(map(response => response.hits.map(hit => hit.nom)));

        return forkJoin([clubsObservable, regroupementsObservable])
            .pipe(map(([clubNames, regroupementNames]) => [...clubNames, ...regroupementNames]));
    }
}
