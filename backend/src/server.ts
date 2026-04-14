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

// Sends a JSON message to a client when its socket is still open.
const sendMessage = (
  socket: WebSocket,
  payload: JoinedMessage | UsersUpdateMessage,
) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

// Returns the list of users who have finished joining with a nickname.
const getConnectedUsers = () => {
  return [...clients.values()]
    .filter((client) => client.nickname)
    .map(({ id, nickname }) => ({ id, nickname }));
};

// Broadcasts the latest user list and active streamer to every connected client.
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

// Parses an incoming WebSocket message and safely ignores invalid JSON.
const parseMessage = (rawMessage: RawData): JoinMessage | null => {
  try {
    return JSON.parse(rawMessage.toString()) as JoinMessage;
  } catch {
    return null;
  }
};

// Creates a client record and wires up message and disconnect handling.
server.on("connection", (socket: WebSocket) => {
  const client: Client = {
    id: randomUUID(),
    nickname: "",
  };

  clients.set(socket, client);

  // Runs when frontend sends something.
  // Handles join messages and stores the user's nickname once validated.
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

  // Removes the disconnected client and clears the streamer if they were active.
  socket.on("close", () => {
    if (currentStreamerId === client.id) {
      currentStreamerId = null;
    }

    clients.delete(socket);
    broadcastState();
  });
});

// Logs the local WebSocket server address once the server starts listening.
server.on("listening", () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});
