import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
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

function createRscPageAliases(outDir) {
  const pageFiles = [];

  const walk = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name === "__PAGE__.txt") {
        pageFiles.push(fullPath);
      }
    }
  };

  if (!existsSync(outDir)) return;
  walk(outDir);

  let created = 0;

  for (const filePath of pageFiles) {
    const relParts = path.relative(outDir, filePath).split(path.sep);
    const markerIndex = relParts.findIndex((part) => part.startsWith("__next."));
    if (markerIndex <= 0) continue;

    const routeDir = relParts.slice(0, markerIndex);
    const nextParts = relParts.slice(markerIndex, -1);
    if (nextParts.length === 0) continue;

    const flatName = `${nextParts.join(".")}.__PAGE__.txt`;
    const targetPath = path.join(outDir, ...routeDir, flatName);

    if (existsSync(targetPath)) continue;
    copyFileSync(filePath, targetPath);
    created += 1;
  }

  if (created > 0) {
    console.log(`Created ${created} static RSC alias file(s) for __PAGE__.txt`);
  }
}

async function main() {
  const env = { ...process.env, NEXT_STATIC_EXPORT: "1" };
  await run("next", ["build"], env);

  const outDir = path.join(process.cwd(), "out");
  const rootServeConfig = path.join(process.cwd(), "serve.json");
  const outServeConfig = path.join(outDir, "serve.json");
  const rootHtaccess = path.join(process.cwd(), ".htaccess");
  const outHtaccess = path.join(outDir, ".htaccess");

  if (existsSync(rootServeConfig)) {
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    copyFileSync(rootServeConfig, outServeConfig);
    // Keep a copy inside out/ because serve resolves config relative to served dir.
    console.log("Copied serve.json -> out/serve.json");
  }

  if (existsSync(rootHtaccess)) {
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    copyFileSync(rootHtaccess, outHtaccess);
    console.log("Copied .htaccess -> out/.htaccess");
  }

  createRscPageAliases(outDir);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
