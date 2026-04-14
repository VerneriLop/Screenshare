import { randomUUID } from "node:crypto";
import { WebSocketServer, type RawData, type WebSocket } from "ws";

const PORT = Number(process.env.PORT || 8080);

type Client = {
  id: string;
  nickname: string;
};

type JoinMessage = {
  type: "join";
  nickname?: unknown;
};

type JoinedMessage = {
  type: "joined";
  user: Client;
};

type UsersUpdateMessage = {
  type: "users:update";
  users: Client[];
  currentStreamerId: string | null;
};

const clients = new Map<WebSocket, Client>();
let currentStreamerId: string | null = null;

const server = new WebSocketServer({ port: PORT });

const sendMessage = (
  socket: WebSocket,
  payload: JoinedMessage | UsersUpdateMessage,
) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const getConnectedUsers = () => {
  return [...clients.values()]
    .filter((client) => client.nickname)
    .map(({ id, nickname }) => ({ id, nickname }));
};

const broadcastState = () => {
  const payload: UsersUpdateMessage = {
    type: "users:update",
    users: getConnectedUsers(),
    currentStreamerId,
  };

  for (const socket of clients.keys()) {
    sendMessage(socket, payload);
  }
};

const parseMessage = (rawMessage: RawData): JoinMessage | null => {
  try {
    return JSON.parse(rawMessage.toString()) as JoinMessage;
  } catch {
    return null;
  }
};

server.on("connection", (socket: WebSocket) => {
  const client: Client = {
    id: randomUUID(),
    nickname: "",
  };

  clients.set(socket, client);

  socket.on("message", (rawMessage: RawData) => {
    const message = parseMessage(rawMessage);

    if (!message || message.type !== "join") {
      return;
    }

    const nickname =
      typeof message.nickname === "string" ? message.nickname.trim() : "";

    if (!nickname) {
      return;
    }

    client.nickname = nickname;

    sendMessage(socket, {
      type: "joined",
      user: {
        id: client.id,
        nickname: client.nickname,
      },
    });

    broadcastState();
  });

  socket.on("close", () => {
    if (currentStreamerId === client.id) {
      currentStreamerId = null;
    }

    clients.delete(socket);
    broadcastState();
  });
});

server.on("listening", () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});
