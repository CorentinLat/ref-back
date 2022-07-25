import { Component, HostListener, NgZone } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import IpcRendererEvent = Electron.IpcRendererEvent;

import { ElectronService } from '../../service/ElectronService';
import { FileService } from '../../service/FileService';
import { ToastService } from '../../service/ToastService';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
    import = new FormGroup({
        video: new FormControl(null, [Validators.required]),
    });

    files: File[] = [];
    errorFiles: File[] = [];

    isProcessingVideos = false;
    progress = 0;

    constructor(
        private electron: ElectronService,
        private fileService: FileService,
        private router: Router,
        private toastService: ToastService,
        private zone: NgZone,
    ) {}

    get videoControl(): FormControl {
        return this.import.get('video') as FormControl;
    }

    @HostListener('change', ['$event.target.files'])
    emitFiles(event: FileList) {
        this.files = [];
        this.errorFiles = [];

        for (let i = 0; i < event.length; i++) {
            const file = event.item(i);
            if (!file) { continue; }

            if (this.fileService.isFileSupported(file)) {
                this.files.push(file);
            } else {
                this.errorFiles.push(file);
            }
        }

        if (this.errorFiles.length) {
            this.videoControl.setErrors({ invalidType: true });
        }
    }

    exposeClassNameForVideoInput(): string {
        if (!this.videoControl.dirty) {
            return 'form-control';
        }
        return this.isVideoControlValid() ? 'form-control is-valid' : 'form-control is-invalid';
    }

    exposeErrorFileNames(): string[] {
        return this.errorFiles.map(({ name }) => name);
    }

    submit() {
        if (this.import.invalid) {
            return;
        }

        const videoPaths = this.files.map(({ path }) => path);

        this.electron.ipcRenderer?.on('process_videos_progress', this.handleProcessVideosProgress);
        this.electron.ipcRenderer?.once('process_videos_succeeded', this.handleProcessVideosSucceeded);
        this.electron.ipcRenderer?.once('process_videos_failed', this.handleProcessVideosFailed);

        this.isProcessingVideos = true;
        this.electron.ipcRenderer?.send('process_videos_imported', videoPaths);
    }

    private isVideoControlValid(): boolean {
        return this.videoControl.valid || (this.videoControl.invalid && this.videoControl.errors?.required);
    }

    private handleProcessVideosProgress = (_: IpcRendererEvent, progress: number) => {
        this.zone.run(() => this.progress = Math.round(progress));
    };

    private handleProcessVideosSucceeded = (_: IpcRendererEvent, videoPath: string) => {
        this.zone.run(() => this.router.navigate(['/match-analysis'], { queryParams: { videoPath } }));
    };

    private handleProcessVideosFailed = (_: IpcRendererEvent) => {
        this.zone.run(() => {
            this.isProcessingVideos = false;
            this.toastService.showError('TOAST.ERROR.PROCESS_VIDEO_FAILED');
        });
    };
}
