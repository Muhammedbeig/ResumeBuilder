import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";
const serveBin = path.join(process.cwd(), "node_modules", "serve", "build", "main.js");
const outServeConfig = path.join(process.cwd(), "out", "serve.json");
const rootServeConfig = path.join(process.cwd(), "serve.json");
const serveConfig = existsSync(outServeConfig) ? outServeConfig : rootServeConfig;

const child = spawn(
  process.execPath,
  [
    serveBin,
    "out",
    "-l",
    `tcp://${host}:${port}`,
    "--config",
    serveConfig,
    "--no-port-switching",
  ],
  {
    stdio: "inherit",
    shell: false,
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
