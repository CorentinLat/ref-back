import { Component, HostListener } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { requiredFileTypes, videoExtensions } from '../shared/utils/file';
import { concatVideos } from '../shared/utils/video';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  import = new FormGroup({
    video: new FormControl(null, [Validators.required]),
  });

  files: File[] = [];
  errorFiles: File[] = [];

  constructor(private router: Router) {}

  get videoControl(): FormControl { return this.import.get('video') as FormControl; }

  @HostListener('change', ['$event.target.files'])
  emitFiles(event: FileList) {
    this.files = [];
    this.errorFiles = [];

    for (let i = 0; i < event.length; i++) {
      const file = event.item(i);
      if (requiredFileTypes(file, videoExtensions)) {
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
    if (!this.videoControl.dirty) { return 'form-control'; }
    return this.isVideoControlValid() ? 'form-control is-valid' : 'form-control is-invalid';
  }

  exposeErrorFileNames(): string[] {
    return this.errorFiles.map(({ name }) => name);
  }

  submit() {
    if (this.import.invalid) { return; }

    if (this.files.length > 1) {
      concatVideos(this.files);
    }
  }

  private isVideoControlValid(): boolean {
    return this.videoControl.valid || (this.videoControl.invalid && this.videoControl.errors.required);
  }
}
