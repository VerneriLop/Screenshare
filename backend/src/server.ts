import { randomUUID } from "node:crypto";
import { WebSocketServer, type RawData, type WebSocket } from "ws";

import type {
  ClientMessage,
  ServerMessage,
  WebRtcAnswerRelayMessage,
  WebRtcIceCandidateRelayMessage,
  WebRtcOfferRelayMessage,
} from "./protocol.js";
import { parseClientMessage } from "./protocol.js";
import { RoomState } from "./room.js";
import { broadcastMessage, sendMessage } from "./socket.js";

const PORT = Number(process.env.PORT || 8080);
const server = new WebSocketServer({ port: PORT });
const room = new RoomState();

const broadcastState = () => {
  broadcastMessage(server.clients, room.createUsersUpdateMessage());
};

const relaySignal = (senderId: string, message: ClientMessage) => {
  if (
    !room.hasJoined(senderId) ||
    message.type === "join" ||
    message.type === "stream:start" ||
    message.type === "stream:stop"
  ) {
    return;
  }

  const targetSocket = room.getSocketByClientId(message.targetId);

  if (!targetSocket || !room.hasJoined(message.targetId)) {
    return;
  }

  let relayMessage: ServerMessage | null = null;

  if (message.type === "webrtc:offer") {
    relayMessage = {
      type: "webrtc:offer",
      fromId: senderId,
      sdp: message.sdp,
    } satisfies WebRtcOfferRelayMessage;
  }

  if (message.type === "webrtc:answer") {
    relayMessage = {
      type: "webrtc:answer",
      fromId: senderId,
      sdp: message.sdp,
    } satisfies WebRtcAnswerRelayMessage;
  }

  if (message.type === "webrtc:ice-candidate") {
    relayMessage = {
      type: "webrtc:ice-candidate",
      fromId: senderId,
      candidate: message.candidate,
    } satisfies WebRtcIceCandidateRelayMessage;
  }

  if (!relayMessage) {
    return;
  }

  sendMessage(targetSocket, relayMessage);
};

const handleMessage = (
  socket: WebSocket,
  clientId: string,
  rawMessage: RawData,
) => {
  const message = parseClientMessage(rawMessage.toString());

  if (!message) {
    return;
  }

  if (message.type === "join") {
    const user = room.setNickname(clientId, message.nickname);

    if (!user) {
      return;
    }

    sendMessage(socket, {
      type: "joined",
      user,
    });

    broadcastState();
    return;
  }

  if (message.type === "stream:start") {
    if (room.setCurrentStreamer(clientId)) {
      broadcastState();
    }

    return;
  }

  if (message.type === "stream:stop") {
    if (room.clearCurrentStreamer(clientId)) {
      broadcastState();
    }

    return;
  }

  relaySignal(clientId, message);
};

// Creates a client record and wires up message and disconnect handling.
server.on("connection", (socket: WebSocket) => {
  const client = room.addClient(socket, randomUUID());

  socket.on("message", (rawMessage: RawData) => {
    handleMessage(socket, client.id, rawMessage);
  });

  socket.on("close", () => {
    room.removeClient(socket);
    broadcastState();
  });
});

// Logs the local WebSocket server address once the server starts listening.
server.on("listening", () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});
