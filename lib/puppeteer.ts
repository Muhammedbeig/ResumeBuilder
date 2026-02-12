import { envBool, envInt } from "@/lib/env";
import type { Browser, Page } from "puppeteer";

type PuppeteerTask<T> = (page: Page, browser: Browser) => Promise<T>;
type PuppeteerOptions = {
  enabled?: boolean;
  concurrency?: number;
};

class AsyncQueue {
  private queue: Array<{
    task: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];
  private active = 0;

  constructor(private concurrency: number) {}

  setConcurrency(concurrency: number) {
    this.concurrency = Math.max(1, concurrency);
    this.drain();
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve: (value: unknown) => resolve(value as T),
        reject,
      });
      this.drain();
    });
  }

  private drain() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) return;
      this.active += 1;
      Promise.resolve()
        .then(item.task)
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.active -= 1;
          this.drain();
        });
    }
  }
}

type PuppeteerGlobal = {
  browser?: Browser;
  launching?: Promise<Browser>;
  queue?: AsyncQueue;
  concurrency?: number;
};

const globalForPuppeteer = globalThis as unknown as PuppeteerGlobal;

const DEFAULT_CONCURRENCY = envInt("PUPPETEER_CONCURRENCY", 2);
const PUPPETEER_ENABLED = envBool("PUPPETEER_ENABLED", true);
const PUPPETEER_DUMPIO = envBool("PUPPETEER_DUMPIO", false);

function getQueue(concurrency: number) {
  const normalized = Math.max(1, Math.floor(concurrency || DEFAULT_CONCURRENCY));
  if (!globalForPuppeteer.queue) {
    globalForPuppeteer.queue = new AsyncQueue(normalized);
    globalForPuppeteer.concurrency = normalized;
  } else if (globalForPuppeteer.concurrency !== normalized) {
    globalForPuppeteer.queue.setConcurrency(normalized);
    globalForPuppeteer.concurrency = normalized;
  }
  return globalForPuppeteer.queue;
}

async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    pipe: true,
    dumpio: PUPPETEER_DUMPIO,
  });
  browser.on("disconnected", () => {
    if (globalForPuppeteer.browser === browser) {
      globalForPuppeteer.browser = undefined;
    }
  });
  return browser;
}

async function getBrowser(enabled: boolean): Promise<Browser> {
  if (!enabled) {
    throw new Error("Puppeteer is disabled");
  }

  if (globalForPuppeteer.browser && globalForPuppeteer.browser.isConnected()) {
    return globalForPuppeteer.browser;
  }

  if (!globalForPuppeteer.launching) {
    globalForPuppeteer.launching = (async () => {
      try {
        const browser = await launchBrowser();
        globalForPuppeteer.browser = browser;
        return browser;
      } finally {
        globalForPuppeteer.launching = undefined;
      }
    })();
  }

  return globalForPuppeteer.launching;
}

export function isPuppeteerEnabled() {
  return PUPPETEER_ENABLED;
}

export async function withPuppeteerPage<T>(
  task: PuppeteerTask<T>,
  options: PuppeteerOptions = {}
): Promise<T> {
  const enabled = options.enabled ?? PUPPETEER_ENABLED;
  if (!enabled) {
    throw new Error("Puppeteer is disabled");
  }

  const queue = getQueue(options.concurrency ?? DEFAULT_CONCURRENCY);
  return queue.run(async () => {
    const browser = await getBrowser(enabled);
    const page = await browser.newPage();
    try {
      return await task(page, browser);
    } finally {
      await page.close().catch(() => undefined);
    }
  }) as Promise<T>;
}
