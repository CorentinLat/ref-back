import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-video-editor-modal',
  templateUrl: './video-editor-modal.component.html',
  styleUrls: ['./video-editor-modal.component.scss']
})
export class VideoEditorModalComponent {
    @Input() videoTitle!: string;
    @Input() videoPath!: string;
    @Input() timing?: number;
    @Input() savePath?: string;

    hasConfiguredEdition = false;
    isProcessingVideo = false;

    constructor(public modal: NgbActiveModal) {}
}
