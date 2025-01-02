import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VideoViewerService {
    public videoMediaEdit = new Subject<void>();
    public videoTimeUpdated = new Subject<number>();
    public videoMediaRefreshed = new Subject<string>();

    public editVideoMedia = () => this.videoMediaEdit.next();
    public updateVideoTime = (time: number) => this.videoTimeUpdated.next(time);
    public refreshVideoMedia = (videoPath: string) => this.videoMediaRefreshed.next(videoPath);
}
