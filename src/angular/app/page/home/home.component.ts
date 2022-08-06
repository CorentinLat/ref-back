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
    gameForm = new FormGroup({
        gameNumber: new FormControl(
            '',
            [Validators.required, Validators.pattern('^\\d{2}\\s\\d{4}\\s\\d{4}$')]
        ),
        video: new FormControl(null, [Validators.required]),
    });

    readonly gameNumberPrefix = '202223';
    readonly gameNumberSuffix = 'RCT';

    files: File[] = [];
    notSupportedFiles: File[] = [];

    isProcessingVideos = false;
    progress = 0;

    constructor(
        private electron: ElectronService,
        private fileService: FileService,
        private router: Router,
        private toastService: ToastService,
        private zone: NgZone,
    ) {}

    get gameNumberControl(): FormControl { return this.gameForm.get('gameNumber') as FormControl; }
    get videoControl(): FormControl { return this.gameForm.get('video') as FormControl; }

    @HostListener('change', ['$event.target.files'])
    emitFiles(files: FileList) {
        if (!files) { return; }

        this.files = [];
        this.notSupportedFiles = [];

        const fileExtensions = new Set<string>();
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (!file) { continue; }

            if (this.fileService.isFileSupported(file)) {
                this.files.push(file);
            } else {
                this.notSupportedFiles.push(file);
            }
            fileExtensions.add(this.fileService.extractFileExtension(file));
        }

        if (this.notSupportedFiles.length) {
            this.videoControl.setErrors({ invalidType: true });
        } else if (fileExtensions.size > 1) {
            this.videoControl.setErrors({ multipleVideoFormat: true });
        }
    }

    exposeClassNameForGameNumberInput(): string {
        if (this.gameNumberControl.pristine || this.gameNumberControl.untouched) {
            return 'form-control';
        }
        return this.isGameNumberControlValid() ? 'form-control is-valid' : 'form-control is-invalid';
    }

    exposeClassNameForVideoInput(): string {
        if (this.videoControl.pristine) {
            return 'form-control';
        }
        return this.isVideoControlValid() ? 'form-control is-valid' : 'form-control is-invalid';
    }

    exposeErrorFileNames(): string[] {
        return this.notSupportedFiles.map(({ name }) => name);
    }

    submit() {
        if (this.gameForm.invalid) {
            return;
        }

        const videoPaths = this.files.map(({ path }) => path);

        this.electron.ipcRenderer?.on('process_videos_progress', this.handleProcessVideosProgress);
        this.electron.ipcRenderer?.once('process_videos_succeeded', this.handleProcessVideosSucceeded);
        this.electron.ipcRenderer?.once('process_videos_failed', this.handleProcessVideosFailed);

        this.isProcessingVideos = true;
        this.electron.ipcRenderer?.send('process_videos_imported', videoPaths);
    }

    private isGameNumberControlValid(): boolean {
        return this.gameNumberControl.valid;
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
            this.videoControl.setErrors({ processVideoFailed: true });
            this.toastService.showError('TOAST.ERROR.PROCESS_VIDEO_FAILED');
        });
    };
}
