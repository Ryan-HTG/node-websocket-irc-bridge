const http = require("http");
const WebSocket = require("ws");
const IRC = require("irc-framework");

const server = http.createServer();
const wss = new WebSocket.Server({
  server,
  path: "/api/irc",
});

// Helper: parse raw IRC events into readable messages
function parseIRCEvent(event) {
  if (!event.line) return null;

  const line = event.line;

  // Private messages
  if (line.includes("PRIVMSG")) {
    const match = line.match(/:(.+?)!.+? PRIVMSG (.+?) :(.+)/);
    if (match) return `[${match[2]}] ${match[1]}: ${match[3]}`;
  }

  // Joins
  if (line.includes("JOIN")) {
    const match = line.match(/:(.+?)!.+? JOIN (.+)/);
    if (match) return `[${match[2]}] ${match[1]} joined`;
  }

  // Parts
  if (line.includes("PART")) {
    const match = line.match(/:(.+?)!.+? PART (.+)/);
    if (match) return `[${match[2]}] ${match[1]} left`;
  }

  // Notices
//  if (line.includes("NOTICE")) {
//    const msg = line.split(":").slice(2).join(":");
//    return `[NOTICE] ${msg}`;
//  }

  // Fallback: ignore other raw messages
  return null;
}

wss.on("connection", (ws, req) => {
  console.log("[WS] Client connected:", req.socket.remoteAddress);

  const client = new IRC.Client();

  client.on("raw", (event) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    const parsed = parseIRCEvent(event);
    if (parsed) ws.send(parsed);
  });

  client.on("registered", () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("[SYSTEM] IRC registered and joined #chatroom");
    }
    client.join("#chatroom");
  });

  client.connect({
    host: "127.0.0.1",
    port: 6667,
    nick: "WebUser" + Math.floor(Math.random() * 99999),
  });

  ws.on("message", (msg) => {
    const stringMsg = msg.toString();
    const jsonMsg = JSON.parse(stringMsg);
    if ("message" in jsonMsg) {
    const textMsg = jsonMsg.message;
    console.log("[WS->IRC]", jsonMsg);
    ws.send("[#chatroom] You said: " + textMsg);
    client.say("#chatroom", textMsg);}
    else {
      console.log("different event");
  }});

  ws.on("close", () => {
    console.log("[WS] Web client closed");
    client.quit("Web client disconnected");
  });
});

server.listen(3001, () =>
  console.log("IRC WebSocket bridge running on port 3001")
);

