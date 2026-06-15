"use client";

import { useEffect, useState } from "react";

interface ScoreData {
  server: string;
  run_date: string;
  total_tasks: number;
  passed: number;
  success_rate: number;
  avg_steps_used: number;
}

interface LiveScores {
  [serverSlug: string]: ScoreData | null;
}

// Cache fetched scores in module scope so all badge instances share one fetch
let cachedScores: LiveScores | null = null;
let fetchPromise: Promise<LiveScores> | null = null;

function fetchScores(): Promise<LiveScores> {
  if (cachedScores) return Promise.resolve(cachedScores);
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/scores", { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => {
      cachedScores = data as LiveScores;
      return cachedScores;
    })
    .catch(() => ({}));
  return fetchPromise;
}

/** Displays a live success-rate percentage for a given server slug. */
export function LiveSuccessRate({
  slug,
  fallback,
}: {
  slug: string;
  fallback: number;
}) {
  const [rate, setRate] = useState<number | null>(null);
  const [runDate, setRunDate] = useState<string | null>(null);

  useEffect(() => {
    fetchScores().then((scores) => {
      const data = scores[slug];
      if (data != null) {
        // success_rate may be 0-1 (fraction) or 0-100 (percentage) depending on run
        const pct =
          data.success_rate <= 1
            ? Math.round(data.success_rate * 100)
            : Math.round(data.success_rate);
        setRate(pct);
        setRunDate(data.run_date ?? null);
      }
    });
  }, [slug]);

  const displayRate = rate ?? fallback;

  return (
    <span className="inline-flex flex-col items-end">
      <span className="text-lg lg:text-2xl font-bold tracking-tight tabular-nums transition-all duration-500">
        {displayRate}%
      </span>
      {runDate && (
        <span className="text-[7px] opacity-40 tracking-wider mt-0.5">
          LAST RUN {runDate}
        </span>
      )}
    </span>
  );
}

/** Returns all live score data for a given server slug. */
export function useLiveScore(slug: string, defaults: { successRate: number; totalTasks: number; avgSteps: number }) {
  const [data, setData] = useState(defaults);

  useEffect(() => {
    fetchScores().then((scores) => {
      const score = scores[slug];
      if (score != null) {
        const pct =
          score.success_rate <= 1
            ? Math.round(score.success_rate * 100)
            : Math.round(score.success_rate);
        setData({
          successRate: pct,
          totalTasks: score.total_tasks ?? defaults.totalTasks,
          avgSteps: score.avg_steps_used ?? defaults.avgSteps,
        });
      }
    });
  }, [slug, defaults.successRate, defaults.totalTasks, defaults.avgSteps]);

  return data;
}
