// Retries an async operation with exponential backoff. Used around database
// calls because Neon's free tier scales to zero and the first connection
// after idle time can fail while the compute wakes up.

export interface RetryOptions {
  attempts?: number; // total tries, default 3
  delayMs?: number; // first wait, doubles each retry, default 800
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, delayMs = 800 }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** i));
      }
    }
  }
  throw lastError;
}