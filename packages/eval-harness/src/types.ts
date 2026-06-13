import { z } from "zod";

export const SuccessCriteriaSchema = z.object({
  type: z.enum(["tool_call_sequence_or_outcome", "outcome_only"]),
  expected_tools_used: z.array(z.string()).optional(),
  verification: z.string(), // Name of verification handler
});

export const TaskSchema = z.object({
  task_id: z.string(),
  description: z.string(),
  target_server: z.string(),
  max_steps: z.number().default(6),
  success_criteria: SuccessCriteriaSchema,
  params: z.record(z.any()).optional(), // Contextual parameters for verifiers
});

export type Task = z.infer<typeof TaskSchema>;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | any[];
}

export interface EvalResult {
  task_id: string;
  success: boolean;
  steps_used: number;
  errors_encountered: string[];
  transcript: ChatMessage[];
}

export interface ScoringReport {
  server: string;
  run_date: string;
  total_tasks: number;
  passed: number;
  success_rate: number;
  avg_steps_used: number;
  common_failure_modes: Array<{
    task_id: string;
    issue: string;
  }>;
}
