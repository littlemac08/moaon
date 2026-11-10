export const CUT_FADE_SECONDS = 0.24;

/** Opacity of a black dip around a preview cut boundary. */
export function previewTransitionOpacity(elapsed, boundaries) {
  return Math.max(0, ...boundaries.map(boundary => 1 - Math.abs(elapsed - boundary) / CUT_FADE_SECONDS));
}

/** Dip gently between adjacent clips without changing the selected durations. */
export function cutTransitions(duration, index, count) {
  const fade = Math.min(CUT_FADE_SECONDS, duration / 2);
  const length = fade.toFixed(6);
  const end = Math.max(0, duration - fade).toFixed(6);
  const video = [];
  const audio = [];
  if (index > 0) {
    video.push(`fade=t=in:st=0:d=${length}`);
    audio.push(`afade=t=in:st=0:d=${length}`);
  }
  if (index < count - 1) {
    video.push(`fade=t=out:st=${end}:d=${length}`);
    audio.push(`afade=t=out:st=${end}:d=${length}`);
  }
  return { video, audio };
}
