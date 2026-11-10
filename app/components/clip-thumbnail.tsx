"use client";

import { Film, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = { url: string; start: number; duration: number; name: string; onClick: () => void };

export function ClipThumbnail({ url, start, duration, name, onClick }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 1 || !Number.isFinite(start)) return;
    const position = Math.max(0, Math.min(start, Math.max(0, duration - .05)));
    try { video.currentTime = position; } catch { /* A frame will appear once seeking is available. */ }
  }, [url, start, duration]);

  return (
    <button type="button" className="clip-thumbnail" onClick={onClick} aria-label={`${name} 영상 미리보기`}>
      {!failed ? <video ref={videoRef} src={url} muted playsInline preload="auto" aria-hidden="true"
        onLoadedMetadata={(event) => {
          const position = Math.max(0, Math.min(Number.isFinite(start) ? start : 0, Math.max(0, duration - .05)));
          try { event.currentTarget.currentTime = position; } catch { /* Keep the default frame. */ }
        }} onError={() => setFailed(true)} /> : <Film size={20} aria-hidden="true" />}
      <span className="clip-thumbnail-play" aria-hidden="true"><Play size={11} fill="currentColor" /></span>
    </button>
  );
}
