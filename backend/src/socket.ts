import type { WebSocket } from "ws";

import type { ServerMessage } from "./protocol.js";

export const sendMessage = (socket: WebSocket, payload: ServerMessage) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

export const broadcastMessage = (
  sockets: Iterable<WebSocket>,
  payload: ServerMessage,
) => {
  for (const socket of sockets) {
    sendMessage(socket, payload);
  }
};
