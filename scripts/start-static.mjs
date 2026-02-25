import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";
const serveBin = path.join(process.cwd(), "node_modules", "serve", "build", "main.js");

const child = spawn(
  process.execPath,
  [
    serveBin,
    "out",
    "-l",
    `tcp://${host}:${port}`,
    "--config",
    "serve.json",
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

