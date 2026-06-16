import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface ScoreData {
  server: string;
  run_date: string;
  total_tasks: number;
  passed: number;
  success_rate: number;
  avg_steps_used: number;
  common_failure_modes: Array<{ task_id: string; issue: string }>;
}

function readResultFile(serverName: string): ScoreData | null {
  try {
    // Walk up from this file to find the monorepo root, then locate the results dir
    const resultsDir = path.resolve(
      process.cwd(),
      "../../packages/eval-harness/results"
    );
    const filePath = path.join(resultsDir, `${serverName}.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ScoreData;
  } catch {
    return null;
  }
}

export async function GET() {
  const servers = ["notion"];
  const scores: Record<string, ScoreData | null> = {};

  for (const server of servers) {
    scores[server] = readResultFile(server);
  }

  return NextResponse.json(scores, {
    headers: {
      // Never cache — always return the latest result file
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
