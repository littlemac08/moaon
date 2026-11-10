"use client";

import { useEffect, useRef } from "react";
import { YuriWater } from "./yuri-water";

type YuriWanderProps = {
  progress: number;
  className: string;
  enabled?: boolean;
};

/** Each crossing is chosen independently; a new crossing starts off-screen. */
export function YuriWander({ progress, className, enabled = true }: YuriWanderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const ghost = ghostRef.current;
    if (!stage || !ghost || !enabled || typeof ghost.animate !== "function") return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | undefined;
    let disposed = false;
    let firstCrossing = true;
    const random = (min: number, max: number) => min + Math.random() * (max - min);

    function travel() {
      if (disposed || motion.matches || !stage || !ghost) return;
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const ghostWidth = ghost.offsetWidth;
      const ghostHeight = ghost.offsetHeight;
      if (!width || !height || !ghostWidth) return;
      const edge = width / 2 + ghostWidth / 2 + 18;
      const verticalRoom = Math.max(0, (height - ghostHeight) / 2 - 4);
      const direction = Math.random() < 0.5 ? 1 : -1;
      const startX = firstCrossing ? random(-width * 0.14, width * 0.14) : -direction * edge;
      const endX = direction * edge;
      const startY = random(-verticalRoom, verticalRoom);
      const endY = random(-verticalRoom, verticalRoom);
      const tilt = random(3, 9);
      const speed = random(38, 120);
      const duration = Math.max(3000, Math.min(16000, Math.abs(endX - startX) / speed * 1000));
      const phase = random(0, Math.PI * 2);
      const speedVariation = random(0.25, 0.65);
      const drift = Math.min(verticalRoom, random(8, 30));
      const transform = (x: number, y: number, angle: number) =>
        `translate(-50%, -50%) translate(${x}px, ${y}px) scaleX(${direction}) rotate(${angle}deg)`;
      // Sample a smooth curve: its positive velocity varies without abrupt stops.
      const frames = Array.from({ length: 33 }, (_, index) => {
        const t = index / 32;
        const travelFraction = t + speedVariation * (Math.sin(2 * Math.PI * t + phase) - Math.sin(phase)) / (2 * Math.PI);
        const verticalDrift = Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * t + phase) * drift;
        const y = Math.max(-verticalRoom, Math.min(verticalRoom, startY + (endY - startY) * t + verticalDrift));
        const angle = Math.sin(2 * Math.PI * t + phase) * tilt;
        return { offset: t, transform: transform(startX + (endX - startX) * travelFraction, y, angle) };
      });
      animation = ghost.animate(frames, { duration, easing: "linear", fill: "forwards" });
      firstCrossing = false;
      animation.onfinish = travel;
      if (document.hidden) animation.pause();
    }

    function updateMotion() {
      animation?.cancel();
      animation = undefined;
      firstCrossing = true;
      if (!motion.matches) travel();
    }
    function updateVisibility() {
      if (!animation) return;
      if (document.hidden) animation.pause();
      else animation.play();
    }
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    updateMotion();
    return () => {
      disposed = true;
      animation?.cancel();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [enabled]);

  return (
    <div className={className} ref={stageRef} aria-hidden="true">
      <div className="yuri-roamer" ref={ghostRef}>
        <YuriWater progress={progress} className="yuri-roamer-art" appIcon />
      </div>
    </div>
  );
}
