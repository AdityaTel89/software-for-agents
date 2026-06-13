import { Task, EvalResult, ScoringReport } from "./types.js";

export function scoreResult(
  serverName: string,
  tasks: Task[],
  results: EvalResult[]
): ScoringReport {
  const total_tasks = results.length;
  const passedResults = results.filter((r) => r.success);
  const passed = passedResults.length;
  const success_rate = total_tasks > 0 ? passed / total_tasks : 0;

  const totalSteps = results.reduce((acc, r) => acc + r.steps_used, 0);
  const avg_steps_used = total_tasks > 0 ? totalSteps / total_tasks : 0;

  const common_failure_modes: Array<{ task_id: string; issue: string }> = [];

  for (const r of results) {
    if (!r.success) {
      let issue = "Unknown verification failure";
      if (r.errors_encountered.length > 0) {
        issue = r.errors_encountered.join("; ");
      } else {
        // Retrieve last assistant message if any
        const lastAssistantMsg = [...r.transcript]
          .reverse()
          .find((m) => m.role === "assistant");
        if (lastAssistantMsg && Array.isArray(lastAssistantMsg.content)) {
          const textBlock = lastAssistantMsg.content.find((b) => b.type === "text");
          if (textBlock && textBlock.text) {
            issue = `Failed verification. Last agent message: "${textBlock.text.substring(0, 100)}..."`;
          }
        }
      }
      common_failure_modes.push({
        task_id: r.task_id,
        issue,
      });
    }
  }

  return {
    server: serverName,
    run_date: new Date().toISOString().split("T")[0],
    total_tasks,
    passed,
    success_rate,
    avg_steps_used,
    common_failure_modes,
  };
}
