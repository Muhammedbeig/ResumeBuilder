import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

/**
 * Executes a shell command and returns a promise.
 */
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

/**
 * Creates aliases for dynamic RSC (React Server Component) payload files.
 * This maps problematic Next.js static export filenames (like $d$id) to a stable '_' placeholder structure.
 * This allows 'serve.json' to have simple, deterministic rules for dynamic routes.
 */
function createRscPageAliases(outDir) {
  const walk = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      // Identify RSC payload files (__PAGE__.txt or files containing dynamic placeholders like $d$id)
      if (entry.isFile() && (entry.name === "__PAGE__.txt" || entry.name.includes("$d$"))) {
        const relParts = path.relative(outDir, fullPath).split(path.sep);
        // Find where the Next.js app router structure starts
        const markerIndex = relParts.findIndex((part) => part.startsWith("__next."));
        if (markerIndex <= 0) continue;

        const routeDir = relParts.slice(0, markerIndex);
        const nextParts = relParts.slice(markerIndex);
        
        // Create a normalized path where dynamic segment placeholders ($d$id, $d$slug, etc.) are replaced with '_'
        const safeNextParts = nextParts.map((p) => p.replace(/\$d\$(id|slug|category)/g, "_"));
        const targetPath = path.join(outDir, ...routeDir, ...safeNextParts);

        if (fullPath === targetPath) continue;
        
        const targetDir = path.dirname(targetPath);
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }
        
        if (!existsSync(targetPath)) {
          copyFileSync(fullPath, targetPath);
        }
      }
    }
  };

  if (!existsSync(outDir)) return;
  walk(outDir);
}

async function main() {
  const env = { ...process.env, NEXT_STATIC_EXPORT: "1" };
  
  // Perform the standard Next.js build and export
  if (!process.env.SKIP_BUILD) {
    await run("next", ["build"], env);
  }

  const outDir = path.join(process.cwd(), "out");
  const rootServeConfig = path.join(process.cwd(), "serve.json");
  const outServeConfig = path.join(outDir, "serve.json");
  const rootHtaccess = path.join(process.cwd(), ".htaccess");
  const outHtaccess = path.join(outDir, ".htaccess");

  // Ensure serve.json is copied to the export directory
  if (existsSync(rootServeConfig)) {
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    copyFileSync(rootServeConfig, outServeConfig);
    console.log("Copied serve.json -> out/serve.json");
  }

  // Ensure .htaccess is preserved for Apache-based hosts (Hostinger)
  if (existsSync(rootHtaccess)) {
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    copyFileSync(rootHtaccess, outHtaccess);
    console.log("Copied .htaccess -> out/.htaccess");
  }

  // Generate RSC aliases to stabilize dynamic routing in static mode
  createRscPageAliases(outDir);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
