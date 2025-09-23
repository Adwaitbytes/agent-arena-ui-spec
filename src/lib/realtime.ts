// Simple WebSocket helper with auto-reconnect and channel pub/sub
// Usage:
// import { ws } from "@/lib/realtime";
// const unsub = ws.sub("ticker", (msg) => console.log(msg));
// ws.pub("ticker", { text: "hello" });

export type RealtimeMessage<T = any> = {
  channel: string;
  data: T;
  ts: number;
};

type Handler = (data: any) => void;

class Realtime {
  private socket: WebSocket | null = null;
  private url: string;
  private openPromise: Promise<void> | null = null;
  private handlers: Map<string, Set<Handler>> = new Map();
  private wantedSubs: Set<string> = new Set();
  private reconnectDelay = 1000;

  constructor(url = "/api/realtime") {
    const loc = typeof window !== "undefined" ? window.location : null;
    const proto = loc && loc.protocol === "https:" ? "wss" : "ws";
    // If relative, the browser will resolve it; keep string for WebSocket()
    this.url = url.startsWith("ws") ? url : `${proto}://${loc?.host}${url}`;
    if (typeof window !== "undefined") {
      this.connect();
    }
  }

  private connect() {
    this.socket = new WebSocket(this.url);
    this.openPromise = new Promise((resolve) => {
      this.socket!.addEventListener("open", () => {
        // re-subscribe wanted channels
        for (const ch of this.wantedSubs) {
          this.socket?.send(JSON.stringify({ type: "sub", channel: ch }));
        }
        resolve();
      });
    });

    this.socket.addEventListener("message", (ev) => {
      try {
        const parsed = JSON.parse(String(ev.data || "{}"));
        if (parsed && parsed.channel && this.handlers.has(parsed.channel)) {
          for (const h of Array.from(this.handlers.get(parsed.channel)!)) h(parsed.data);
        }
      } catch {}
    });

    this.socket.addEventListener("close", () => {
      // attempt reconnect
      setTimeout(() => this.connect(), this.reconnectDelay);
      // exponential backoff up to 10s
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000);
    });
  }

  async ensureOpen() {
    if (!this.openPromise) return;
    return this.openPromise;
  }

  sub(channel: string, handler: Handler) {
    if (!this.handlers.has(channel)) this.handlers.set(channel, new Set());
    this.handlers.get(channel)!.add(handler);
    this.wantedSubs.add(channel);
    // send sub if already open
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "sub", channel }));
    }
    return () => this.unsub(channel, handler);
  }

  unsub(channel: string, handler?: Handler) {
    if (handler) this.handlers.get(channel)?.delete(handler);
    else this.handlers.delete(channel);
    if (!this.handlers.get(channel) || this.handlers.get(channel)!.size === 0) {
      this.wantedSubs.delete(channel);
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "unsub", channel }));
      }
    }
  }

  async pub(channel: string, data: any) {
    // Use HTTP POST to avoid needing pub permissions on ws
    await fetch("/api/realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, data }),
    });
  }
}

export const ws = new Realtime();