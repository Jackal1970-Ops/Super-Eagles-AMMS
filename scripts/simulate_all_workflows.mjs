/**
 * Runs the executable 360-degree workflow suite through Vitest, which can load
 * the application's TypeScript module graph and fails on any broken workflow.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vitestBin = path.join(projectRoot, "node_modules", "vitest", "vitest.mjs");
const workflowTest = path.join(projectRoot, "src", "lib", "analytics", "__tests__", "full_workflow_simulation.test.ts");

const result = spawnSync(process.execPath, [vitestBin, "run", workflowTest], {
  cwd: projectRoot,
  stdio: "inherit",
});

if (result.error) {
  console.error("Unable to start the workflow simulation:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
