type QueueJob<T> = {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

export class RateLimiter {
  private queue: Array<QueueJob<unknown>> = [];
  private running = false;
  private lastStartedAt = 0;

  constructor(private readonly intervalMs: number) {}

  enqueue<T>(run: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ run, resolve: resolve as (value: unknown) => void, reject });
      void this.drain();
    });
  }

  private async drain() {
    if (this.running) return;
    this.running = true;

    try {
      while (this.queue.length > 0) {
        const elapsed = Date.now() - this.lastStartedAt;
        const waitMs = Math.max(0, this.intervalMs - elapsed);

        if (waitMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }

        const job = this.queue.shift();
        if (!job) continue;

        this.lastStartedAt = Date.now();

        try {
          const value = await job.run();
          job.resolve(value);
        } catch (error) {
          job.reject(error);
        }
      }
    } finally {
      this.running = false;
    }
  }
}

const globalForRateLimiter = globalThis as typeof globalThis & {
  __fourChanRateLimiter?: RateLimiter;
};

export const fourChanRateLimiter =
  globalForRateLimiter.__fourChanRateLimiter ?? new RateLimiter(1_000);

globalForRateLimiter.__fourChanRateLimiter = fourChanRateLimiter;
