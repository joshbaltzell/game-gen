// Standalone EventBus — no Phaser dependency so it's safe to import from SSR contexts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: Map<string, Listener[]> = new Map();

  on(event: string, fn: Listener): this {
    const listeners = this.events.get(event) || [];
    listeners.push(fn);
    this.events.set(event, listeners);
    return this;
  }

  off(event: string, fn?: Listener): this {
    if (!fn) {
      this.events.delete(event);
    } else {
      const listeners = this.events.get(event) || [];
      this.events.set(
        event,
        listeners.filter((l) => l !== fn)
      );
    }
    return this;
  }

  // Alias for compatibility
  removeListener(event: string, fn?: Listener): this {
    return this.off(event, fn);
  }

  once(event: string, fn: Listener): this {
    const wrapped: Listener = (...args: unknown[]) => {
      fn(...args);
      this.off(event, wrapped);
    };
    return this.on(event, wrapped);
  }

  emit(event: string, ...args: unknown[]): this {
    const listeners = this.events.get(event) || [];
    for (const fn of listeners) {
      fn(...args);
    }
    return this;
  }

  removeAllListeners(): this {
    this.events.clear();
    return this;
  }
}

export const EventBus = new SimpleEventEmitter();
