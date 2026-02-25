import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
      }
    });
  });
}

async function main() {
  const env = { ...process.env, NEXT_STATIC_EXPORT: "1" };
  await run("next", ["build"], env);

  const outDir = path.join(process.cwd(), "out");
  const rootServeConfig = path.join(process.cwd(), "serve.json");
  const outServeConfig = path.join(outDir, "serve.json");

  if (existsSync(rootServeConfig)) {
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    copyFileSync(rootServeConfig, outServeConfig);
    // Keep a copy inside out/ because serve resolves config relative to served dir.
    console.log("Copied serve.json -> out/serve.json");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

