/**
 * Browser-safe shim for node:async_hooks.
 *
 * TanStack Start's `@tanstack/start-storage-context` uses AsyncLocalStorage
 * on the server for SSR context propagation. On the browser, the client code
 * calls `createIsomorphicFn().client(...)` which short-circuits the server
 * path — so AsyncLocalStorage is never actually invoked in browser code.
 *
 * However, because the module is imported at the top level, Vite must resolve
 * the import. This shim provides a no-op class so that `new AsyncLocalStorage()`
 * does not throw in the browser environment while the module initialises.
 */
export class AsyncLocalStorage<T = unknown> {
  private store: T | undefined;

  run<R>(store: T, callback: (...args: unknown[]) => R): R {
    const prev = this.store;
    this.store = store;
    try {
      return callback();
    } finally {
      this.store = prev;
    }
  }

  getStore(): T | undefined {
    return this.store;
  }

  enterWith(store: T): void {
    this.store = store;
  }

  disable(): void {
    // no-op in browser
  }

  static bind<T extends (...args: unknown[]) => unknown>(fn: T): T {
    return fn;
  }

  static snapshot(): () => void {
    return () => {};
  }
}

export class AsyncResource {
  constructor(_type: string) {}
  runInAsyncScope<R>(fn: (...args: unknown[]) => R): R {
    return fn();
  }
  static bind<T extends (...args: unknown[]) => unknown>(fn: T): T {
    return fn;
  }
}

export function createHook() {
  return { enable: () => {}, disable: () => {} };
}
export function executionAsyncId() { return 0; }
export function triggerAsyncId() { return 0; }
export function executionAsyncResource() { return new AsyncResource('root'); }
