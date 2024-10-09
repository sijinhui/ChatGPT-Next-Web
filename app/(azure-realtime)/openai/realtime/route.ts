import { LowLevelRTClient } from "rt-client";

let realtimeStreaming: LowLevelRTClient;

export function GET() {
  const headers = new Headers();
  headers.set("Connection", "Upgrade");
  headers.set("Upgrade", "websocket");
  return new Response("Upgrade Required", { status: 426, headers });
}

export function SOCKET(
  client: import("ws").WebSocket,
  _request: import("node:http").IncomingMessage,
  server: import("ws").WebSocketServer,
) {
  const { send, broadcast } = createHelpers(client, server);

  // When a new client connects broadcast a connect message
  broadcast({ author: "Server", content: "A new client has connected." });
  send({ author: "Server", content: "Welcome!" });
  // 新链接时同步建立到后台的
  // realtimeStreaming = new LowLevelRTClient(
  //   new URL(process.env.AZURE_URL),
  //   { key: process.env.AZURE_API_KEY },
  //   { deployment: "gpt-4o-realtime-preview" });

  // Relay any message back to other clients
  client.on("message", broadcast);

  // When this client disconnects broadcast a disconnect message
  client.on("close", () => {
    broadcast({ author: "Server", content: "A client has disconnected." });
    realtimeStreaming?.close();
  });
}

function createHelpers(
  client: import("ws").WebSocket,
  server: import("ws").WebSocketServer,
) {
  const send = (payload: unknown) => client.send(JSON.stringify(payload));
  const broadcast = (payload: unknown) => {
    if (payload instanceof Buffer) payload = payload.toString();
    if (typeof payload !== "string") payload = JSON.stringify(payload);
    for (const other of server.clients)
      if (other !== client) other.send(String(payload));

    console.log("-----,", payload);
  };
  return { send, broadcast };
}
