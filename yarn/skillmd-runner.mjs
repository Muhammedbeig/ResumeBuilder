#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const command = process.argv[2];
const args = process.argv.slice(3);

const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";

function run(bin, runArgs) {
  const result = spawnSync(bin, runArgs, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(
      `[skillmd-runner] Failed to run "${bin} ${runArgs.join(" ")}": ${result.error.message}`,
    );
    return 1;
  }

  if (typeof result.status === "number") {
    return result.status;
  }

  return 1;
}

function runNpm(runArgs) {
  return run(npmBin, runArgs);
}

function runPrettier(extraArgs = []) {
  return runNpm([
    "exec",
    "--yes",
    "prettier@3.6.2",
    "--",
    "--check",
    ".",
    ...extraArgs,
  ]);
}

function runLint() {
  return runNpm(["run", "lint"]);
}

function runTypecheck() {
  return runNpm(["run", "typecheck"]);
}

function runMappedTests(label, passthroughArgs = []) {
  const extra = passthroughArgs.length
    ? ` | passthrough args: ${passthroughArgs.join(" ")}`
    : "";
  console.log(
    `[skillmd-runner] ${label} mapped to lint + typecheck for this repository${extra}`,
  );
  const lintStatus = runLint();
  if (lintStatus !== 0) return lintStatus;
  return runTypecheck();
}

switch (command) {
  case "prettier": {
    process.exit(runPrettier(args));
  }
  case "linc": {
    process.exit(runLint());
  }
  case "flow": {
    const renderer = args[0] || "dom-node";
    console.log(
      `[skillmd-runner] flow renderer "${renderer}" mapped to TypeScript typecheck`,
    );
    process.exit(runTypecheck());
  }
  case "test":
  case "test-www":
  case "test-stable":
  case "test-classic": {
    process.exit(runMappedTests(command, args));
  }
  case "extract-errors": {
    console.log(
      "[skillmd-runner] extract-errors is not applicable in this Next.js repository",
    );
    process.exit(0);
  }
  case "verify": {
    const prettierStatus = runPrettier();
    if (prettierStatus !== 0) process.exit(prettierStatus);

    const lintStatus = runLint();
    if (lintStatus !== 0) process.exit(lintStatus);

    const flowStatus = runTypecheck();
    if (flowStatus !== 0) process.exit(flowStatus);

    const sourceTestStatus = runMappedTests("test", args);
    if (sourceTestStatus !== 0) process.exit(sourceTestStatus);

    const wwwTestStatus = runMappedTests("test-www", args);
    process.exit(wwwTestStatus);
  }
  default: {
    console.error(
      `[skillmd-runner] Unknown command: ${command ?? "(missing)"}`,
    );
    process.exit(1);
  }
}
