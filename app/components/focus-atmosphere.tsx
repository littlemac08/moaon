"use client";

import { useId } from "react";

/** A quiet landscape for Yuri to wander through. */
export function FocusAtmosphere() {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="focus-atmosphere" viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#91bee9" stopOpacity=".32" />
          <stop offset="1" stopColor="#91bee9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#bdd9f7" stopOpacity="0" />
          <stop offset=".5" stopColor="#bdd9f7" stopOpacity=".45" />
          <stop offset="1" stopColor="#bdd9f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="260" cy="490" rx="240" ry="255" fill={`url(#${id}-glow)`} />
      <ellipse cx="25" cy="110" rx="200" ry="200" fill={`url(#${id}-glow)`} opacity=".32" />
      <g className="focus-atmosphere-orbit" fill="none" stroke={`url(#${id}-line)`}>
        <ellipse cx="195" cy="508" rx="145" ry="160" strokeWidth=".8" opacity=".55" />
        <ellipse cx="195" cy="508" rx="153" ry="168" strokeWidth=".5" opacity=".25" />
      </g>
      <g fill="none" stroke={`url(#${id}-line)`} strokeWidth=".8">
        <path d="M-75 420 C35 375 80 470 195 452 S350 357 465 405" />
        <path d="M-75 433 C35 388 80 483 195 465 S350 370 465 418" opacity=".45" />
        <path d="M-70 680 C75 616 150 711 270 653 S400 612 465 640" opacity=".65" />
        <path d="M-55 692 C90 628 160 723 280 665 S410 624 475 652" opacity=".3" />
        <path d="M280 -30 C360 10 410 100 390 185" opacity=".5" />
      </g>
      <g fill="#d4e8ff">
        <circle cx="46" cy="260" r="1.2" opacity=".55" />
        <circle cx="334" cy="300" r="1" opacity=".5" />
        <circle cx="70" cy="550" r="1" opacity=".5" />
        <circle cx="320" cy="578" r="1.4" opacity=".6" />
        <circle cx="250" cy="730" r=".8" opacity=".4" />
      </g>
    </svg>
  );
}
