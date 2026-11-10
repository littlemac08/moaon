"use client";

import { useId } from "react";

const outline = "M24 44C24 39 23 36 24 31C25 17 35 10 50 10C65 10 75 17 76 31C77 36 76 39 76 44C76 49 81 42 84 39C90 33 96 39 91 46C88 52 80 56 79 62C78 69 83 77 80 82C77 88 71 83 67 82C62 80 59 89 50 89C41 89 38 80 33 82C29 83 23 88 20 82C17 77 22 69 21 62C20 56 12 52 9 46C4 39 10 33 16 39C19 42 24 49 24 44Z";

export function CalendarGhost({ progress }: { progress: number }) {
  const id = `calendar-yuri-${useId().replace(/:/g, "")}`;
  const value = Math.max(0, Math.min(100, progress));
  return (
    <svg className="calendar-date-ghost" viewBox="0 0 100 100" aria-hidden="true">
      <defs><clipPath id={id}><path d={outline} /></clipPath></defs>
      <path d={outline} fill="#f7faff" />
      <g clipPath={`url(#${id})`}>
        <g className="yuri-water-level" style={{ "--wave-y": `${85 - value * .79}px` } as React.CSSProperties}>
          <path className="yuri-wave yuri-wave-front" d="M-100 0 C-75 5 -75 -5 -50 0 S-25 5 0 0 S25 -5 50 0 S75 5 100 0 S125 -5 150 0 S175 5 200 0 V120 H-100 Z" />
        </g>
      </g>
      <path d={outline} fill="none" stroke="#648bc0" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
