type EventCallback = (payload?: any) => void;

export class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  public on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  public emit(event: string, payload?: any) {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      callback(payload);
    }
  }
}
