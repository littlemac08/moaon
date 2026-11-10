"use client";

import { useId } from "react";

/** Shared, decorative Yuri illustration; the parent provides the accessible label. */
export function YuriWater({ progress, className, appIcon = false, outlined = false }: { progress: number; className: string; appIcon?: boolean; outlined?: boolean }) {
  const clipId = `yuri-water-${useId().replace(/:/g, "")}`;
  const value = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
                        <defs>
                          <clipPath id={clipId}>
                            <path d="M24 44C24 39 23 36 24 31C25 17 35 10 50 10C65 10 75 17 76 31C77 36 76 39 76 44C76 49 81 42 84 39C90 33 96 39 91 46C88 52 80 56 79 62C78 69 83 77 80 82C77 88 71 83 67 82C62 80 59 89 50 89C41 89 38 80 33 82C29 83 23 88 20 82C17 77 22 69 21 62C20 56 12 52 9 46C4 39 10 33 16 39C19 42 24 49 24 44Z" />
                          </clipPath>
                        </defs>
                        <g clipPath={`url(#${clipId})`}>
                          <rect width="100" height="100" fill={appIcon ? "#f5faff" : "#d9e8f7"} />
                          <g className="yuri-water-level" style={{ "--wave-y": `${84 - value * 0.9}px` } as React.CSSProperties}>
                            <path className="yuri-wave yuri-wave-back" d="M-100 0 C-75 -6 -75 6 -50 0 S-25 -6 0 0 S25 6 50 0 S75 -6 100 0 S125 6 150 0 S175 -6 200 0 V120 H-100 Z" />
                            <path className="yuri-wave yuri-wave-front" d="M-100 0 C-75 5 -75 -5 -50 0 S-25 5 0 0 S25 -5 50 0 S75 5 100 0 S125 -5 150 0 S175 5 200 0 V120 H-100 Z" />
                          </g>
                        </g>
                        <path d="M24 44C24 39 23 36 24 31C25 17 35 10 50 10C65 10 75 17 76 31C77 36 76 39 76 44C76 49 81 42 84 39C90 33 96 39 91 46C88 52 80 56 79 62C78 69 83 77 80 82C77 88 71 83 67 82C62 80 59 89 50 89C41 89 38 80 33 82C29 83 23 88 20 82C17 77 22 69 21 62C20 56 12 52 9 46C4 39 10 33 16 39C19 42 24 49 24 44Z" fill="none" stroke={appIcon ? (outlined ? "#8aaacb" : "none") : "#7397bf"} strokeWidth={appIcon ? "1.5" : "1.8"} strokeLinejoin="round" />
                        <circle cx={appIcon ? "40" : "42"} cy={appIcon ? "37" : "31"} r={appIcon ? "3.2" : "2.2"} fill={appIcon ? "#31577f" : "#314f78"} />
                        <circle cx={appIcon ? "60" : "58"} cy={appIcon ? "37" : "31"} r={appIcon ? "3.2" : "2.2"} fill={appIcon ? "#31577f" : "#314f78"} />
                        <path d={appIcon ? "M40 51Q50 60 60 51" : "M42 43Q50 50 58 43"} fill="none" stroke={appIcon ? "#31577f" : "#314f78"} strokeWidth={appIcon ? "3" : "2"} strokeLinecap="round" />
                      </svg>
  );
}
