import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { DateTimeService } from '../../../service/DateTimeService';

@Component({
  selector: 'app-video-editor-modal',
  templateUrl: './video-editor-modal.component.html',
  styleUrls: ['./video-editor-modal.component.scss']
})
export class VideoEditorModalComponent implements OnInit {
    @Input() videoTitle!: string;
    @Input() videoPath!: string;
    @Input() timing?: number;

    isClipEdition!: boolean;
    isEditing!: boolean;
    isEditionValid = false;
    isProcessingVideo = false;

    currentVideoTime!: number;
    clip = { begin: 0, end: 0 };
    game = { firstHalf: { begin: 0, end: 0 }, secondHalf: { begin: 0, end: 0 } };

    constructor(
        private dateTimeService: DateTimeService,
        public modal: NgbActiveModal,
    ) {}

    ngOnInit(): void {
        this.isClipEdition = this.timing !== undefined;
        this.isEditing = !this.isClipEdition;
    }

    handleVideoReady = (currentTime: number) => this.currentVideoTime = currentTime;

    handleVideoTimeUpdated = (currentTime: number) => {
        this.currentVideoTime = currentTime;

        if (this.isEditing && this.isClipEdition) {
            if (currentTime < this.clip.begin) {
                this.clip.end = this.clip.begin;
            } else {
                this.clip.end = currentTime;
            }

            this.checkEditionValidity();
        }
    };

    handleVideoPaused = () => {
        if (this.isEditing && this.isClipEdition) {
            if (this.clip.end < this.clip.begin) {
                this.clip.end = this.clip.begin;

                this.checkEditionValidity();
            }
        }
    };

    handleEditVideo = () => {
        this.isEditing = true;

        if (this.isClipEdition) {
            this.clip.begin = this.currentVideoTime;
            this.clip.end = this.currentVideoTime;
        }

        this.checkEditionValidity();
    };

    handleCancelEdit = () => {
        if (this.isClipEdition) {
            this.isEditing = false;
            this.isEditionValid = false;
        } else {
            this.modal.dismiss();
        }
    };

    handleUpdateClipBeginToCurrent = () => {
        if (this.isClipEdition) {
            this.clip.begin = this.currentVideoTime;
            if (this.clip.end < this.clip.begin) {
                this.clip.end = this.clip.begin;
            }

            this.checkEditionValidity();
        }
    };

    handleUpdateFirstHalfBeginToCurrent = () => {
        if (!this.isClipEdition) {
            this.game.firstHalf.begin = this.currentVideoTime;
            this.checkEditionValidity();
        }
    };

    handleUpdateFirstHalfEndToCurrent = () => {
        if (!this.isClipEdition) {
            this.game.firstHalf.end = this.currentVideoTime;
            this.checkEditionValidity();
        }
    };

    handleUpdateSecondHalfBeginToCurrent = () => {
        if (!this.isClipEdition) {
            this.game.secondHalf.begin = this.currentVideoTime;
            this.checkEditionValidity();
        }
    };

    handleUpdateSecondHalfEndToCurrent = () => {
        if (!this.isClipEdition) {
            this.game.secondHalf.end = this.currentVideoTime;
            this.checkEditionValidity();
        }
    };

    handleSubmitVideoProcessing = () => {
        this.isProcessingVideo = true;
    };

    exposeSecondToMMSS = (seconds: number) => this.dateTimeService.convertSecondsToMMSS(seconds);

    private checkEditionValidity = () => {
        if (this.isClipEdition) {
            this.isEditionValid = this.clip.end > this.clip.begin;
        } else {
            this.isEditionValid = this.game.firstHalf.begin < this.game.firstHalf.end
                && this.game.firstHalf.end <= this.game.secondHalf.begin
                && this.game.secondHalf.begin < this.game.secondHalf.end;
        }
    };
}
