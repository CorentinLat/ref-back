import editly from 'editly';

export function concatVideos(videos: File[]) {
  editly({
    outPath: 'concat.mp4',
    clips: [],
  });
}
