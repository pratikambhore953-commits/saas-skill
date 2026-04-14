"use client";

import { useEffect, useMemo, useState } from "react";

type ScoreRingProps = {
  score: number;
  size?: number;
  animated?: boolean;
};

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function getScoreColor(score: number): string {
  if (score <= 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#22c55e";
}

export default function ScoreRing({ score, size = 200, animated = true }: ScoreRingProps) {
  const normalizedScore = clampScore(score);
  const stroke = Math.max(8, Math.round(size * 0.08));
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;

  const [displayedScore, setDisplayedScore] = useState(0);

  useEffect(() => {
    if (!animated) return;

    const durationMs = 900;
    const startAt = performance.now();
    let frameId = 0;

    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startAt) / durationMs);
      setDisplayedScore(Math.round(normalizedScore * progress));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [animated, normalizedScore]);

  const visualScore = animated ? displayedScore : normalizedScore;

  const dashOffset = useMemo(() => {
    return circumference - (visualScore / 100) * circumference;
  }, [circumference, visualScore]);

  const scoreColor = getScoreColor(visualScore);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{visualScore}</span>
        <span className="text-xs uppercase tracking-[0.18em] text-slate-300">/100</span>
      </div>
    </div>
  );
}
