import { envInt } from "@/lib/env";

type QueueTask<T> = () => Promise<T>;

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

  run<T>(task: QueueTask<T>): Promise<T> {
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

type PdfQueueGlobal = {
  queue?: AsyncQueue;
  concurrency?: number;
};

const DEFAULT_CONCURRENCY = envInt("PDF_RENDER_CONCURRENCY", envInt("PUPPETEER_CONCURRENCY", 2));
const DEFAULT_TIMEOUT_MS = envInt("PDF_RENDER_TIMEOUT_MS", 45_000);

const globalPdfQueue = globalThis as unknown as PdfQueueGlobal;

function getQueue(concurrency: number) {
  const normalized = Math.max(1, Math.floor(concurrency || DEFAULT_CONCURRENCY));
  if (!globalPdfQueue.queue) {
    globalPdfQueue.queue = new AsyncQueue(normalized);
    globalPdfQueue.concurrency = normalized;
  } else if (globalPdfQueue.concurrency !== normalized) {
    globalPdfQueue.queue.setConcurrency(normalized);
    globalPdfQueue.concurrency = normalized;
  }
  return globalPdfQueue.queue;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const normalizedTimeout = Math.max(1_000, timeoutMs || DEFAULT_TIMEOUT_MS);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("PDF render timed out"));
    }, normalizedTimeout);
    timer.unref?.();

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function runPdfRenderTask<T>(
  task: QueueTask<T>,
  options?: { concurrency?: number; timeoutMs?: number }
): Promise<T> {
  const queue = getQueue(options?.concurrency ?? DEFAULT_CONCURRENCY);
  return queue.run(() => withTimeout(task(), options?.timeoutMs ?? DEFAULT_TIMEOUT_MS)) as Promise<T>;
}

