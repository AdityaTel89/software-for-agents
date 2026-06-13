import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { runEval } from './runEval.js';
import { verifyTask } from './verify.js';
import { scoreResult } from './scoreResult.js';
import { TaskSchema, Task, EvalResult } from './types.js';

// Load environment variables from monorepo root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(rootDir, '.env') });

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const serverArg = args.find((arg) => arg.startsWith('--server='));
  const urlArg = args.find((arg) => arg.startsWith('--url='));

  if (!serverArg) {
    console.error('Error: --server=<name> argument is required.');
    console.log('Usage: pnpm run eval --server=notion [--url=http://localhost:8080/sse]');
    process.exit(1);
  }

  const serverName = serverArg.split('=')[1];
  const serverUrl = urlArg ? urlArg.split('=')[1] : 'http://localhost:8080/sse';

  const tasksFilePath = path.join(__dirname, `../tasks/${serverName}-tasks.json`);

  if (!fs.existsSync(tasksFilePath)) {
    console.error(`Error: Tasks file not found at ${tasksFilePath}`);
    process.exit(1);
  }

  console.log(`\n==========================================`);
  console.log(`Starting Evaluation Harness for server: ${serverName}`);
  console.log(`MCP Server SSE Endpoint: ${serverUrl}`);
  console.log(`==========================================\n`);

  // Load and parse tasks
  let tasks: Task[] = [];
  try {
    const rawData = fs.readFileSync(tasksFilePath, 'utf8');
    const parsedData = JSON.parse(rawData);
    if (!Array.isArray(parsedData)) {
      throw new Error('Tasks file must contain a JSON array.');
    }

    tasks = parsedData.map((taskData, index) => {
      const parsed = TaskSchema.safeParse(taskData);
      if (!parsed.success) {
        throw new Error(`Invalid task definition at index ${index}: ${parsed.error.message}`);
      }
      return parsed.data;
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to load or parse tasks file: ${errMsg}`);
    process.exit(1);
  }

  const results: EvalResult[] = [];

  for (const task of tasks) {
    console.log(`Running Task [${task.task_id}]: ${task.description.substring(0, 80)}...`);
    try {
      // 1. Run the Claude execution loop
      const evalResult = await runEval(task, serverUrl);

      // 2. Run the verification check
      console.log(`Running verification for [${task.task_id}]...`);
      const isSuccess = await verifyTask(task, evalResult);
      evalResult.success = isSuccess;

      console.log(
        `Result: ${isSuccess ? '✅ PASSED' : '❌ FAILED'} (${evalResult.steps_used} steps)\n`,
      );
      results.push(evalResult);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Unexpected error running task ${task.task_id}:`, errMsg);
      results.push({
        task_id: task.task_id,
        success: false,
        steps_used: 0,
        errors_encountered: [errMsg],
        transcript: [],
      });
    }
  }

  // 3. Score the results
  const report = scoreResult(serverName, tasks, results);

  // Print Summary
  console.log(`==========================================`);
  console.log(`Evaluation Summary for ${serverName}`);
  console.log(`==========================================`);
  console.log(`Run Date:      ${report.run_date}`);
  console.log(`Total Tasks:   ${report.total_tasks}`);
  console.log(`Passed Tasks:  ${report.passed}`);
  console.log(`Success Rate:  ${(report.success_rate * 100).toFixed(1)}%`);
  console.log(`Avg Steps:     ${report.avg_steps_used.toFixed(1)}`);

  if (report.common_failure_modes.length > 0) {
    console.log(`\nFailure Modes:`);
    report.common_failure_modes.forEach((fail) => {
      console.log(`  - [${fail.task_id}]: ${fail.issue}`);
    });
  }
  console.log(`==========================================\n`);

  // Write files to results directory
  const resultsDir = path.join(__dirname, '../results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const reportPath = path.join(resultsDir, `${serverName}.json`);
  const detailsPath = path.join(resultsDir, `${serverName}-details.json`);

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(detailsPath, JSON.stringify({ report, results }, null, 2), 'utf8');

  console.log(`Scoring report written to: ${reportPath}`);
  console.log(`Detailed transcripts written to: ${detailsPath}\n`);
}

main().catch((err) => {
  console.error('Fatal error in eval runner:', err);
  process.exit(1);
});
