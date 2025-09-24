export const runtime = "edge";

// Simple in-memory pub/sub using WebSocket on the edge runtime
// Channels: "ticker", `match:${matchId}`

// @ts-expect-error - global registry for sockets per channel
const channels: Map<string, Set<WebSocket>> = (globalThis as any).__WS_CHANNELS__ || new Map();
// @ts-expect-error - persist across hot reloads
(globalThis as any).__WS_CHANNELS__ = channels;

function getSet(key: string) {
  let set = channels.get(key);
  if (!set) {
    set = new Set();
    channels.set(key, set);
  }
  return set;
}

function broadcast(channel: string, data: any) {
  const set = channels.get(channel);
  if (!set) return;
  const payload = JSON.stringify({ channel, data, ts: Date.now() });
  for (const ws of Array.from(set)) {
    try {
      ws.send(payload);
    } catch (_) {}
  }
}

export async function GET(request: Request) {
  const upgradeHeader = request.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const { 0: client, 1: server } = new (WebSocket as any).Pair();

  server.accept();

  // The client must send: { type: "sub", channel: string }
  server.addEventListener("message", (event: MessageEvent) => {
    try {
      const msg = JSON.parse(String(event.data || "{}"));
      if (msg?.type === "ping") {
        server.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        return;
      }
      if (msg?.type === "sub" && typeof msg.channel === "string") {
        const set = getSet(msg.channel);
        set.add(server);
        server.send(JSON.stringify({ type: "subscribed", channel: msg.channel }));
        server.addEventListener("close", () => set.delete(server));
        return;
      }
      if (msg?.type === "unsub" && typeof msg.channel === "string") {
        const set = getSet(msg.channel);
        set.delete(server);
        server.send(JSON.stringify({ type: "unsubscribed", channel: msg.channel }));
        return;
      }
      if (msg?.type === "pub" && typeof msg.channel === "string") {
        broadcast(msg.channel, msg.data);
        return;
      }
    } catch (_) {}
  });

  server.addEventListener("close", () => {
    // cleanup: remove from all channels
    for (const set of channels.values()) set.delete(server);
  });

  // greet
  server.send(JSON.stringify({ type: "hello", ts: Date.now() }));

  return new Response(null as any, { status: 101, webSocket: client });
}

// Broadcast from server code (e.g., orchestrate) using HTTP POST
export async function POST(request: Request) {
  try {
    const { channel, data } = await request.json();
    if (!channel) return new Response(JSON.stringify({ error: "channel required" }), { status: 400 });
    broadcast(channel, data);
    return Response.json({ ok: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid payload" }), { status: 400 });
  }
}