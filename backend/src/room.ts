import type { WebSocket } from "ws";

import type { ConnectedUser, UsersUpdateMessage } from "./protocol.js";

type ClientRecord = {
  id: string;
  nickname: string;
};

export class RoomState {
  private clients = new Map<WebSocket, ClientRecord>();

  private socketsByClientId = new Map<string, WebSocket>();

  private currentStreamerId: string | null = null;

  addClient(socket: WebSocket, clientId: string) {
    const client: ClientRecord = {
      id: clientId,
      nickname: "",
    };

    this.clients.set(socket, client);
    this.socketsByClientId.set(client.id, socket);

    return client;
  }

  removeClient(socket: WebSocket) {
    const client = this.clients.get(socket);

    if (!client) {
      return;
    }

    if (this.currentStreamerId === client.id) {
      this.currentStreamerId = null;
    }

    this.clients.delete(socket);
    this.socketsByClientId.delete(client.id);
  }

  hasJoined(clientId: string) {
    return this.getClientById(clientId)?.nickname.length !== 0;
  }

  setNickname(clientId: string, nickname: string) {
    const client = this.getClientById(clientId);

    if (!client) {
      return null;
    }

    client.nickname = nickname;

    return this.toConnectedUser(client);
  }

  getCurrentStreamerId() {
    return this.currentStreamerId;
  }

  setCurrentStreamer(clientId: string) {
    if (!this.hasJoined(clientId)) {
      return false;
    }

    if (this.currentStreamerId && this.currentStreamerId !== clientId) {
      return false;
    }

    this.currentStreamerId = clientId;

    return true;
  }

  clearCurrentStreamer(clientId: string) {
    if (this.currentStreamerId !== clientId) {
      return false;
    }

    this.currentStreamerId = null;

    return true;
  }

  getSocketByClientId(clientId: string) {
    return this.socketsByClientId.get(clientId) ?? null;
  }

  createUsersUpdateMessage(): UsersUpdateMessage {
    return {
      type: "users:update",
      users: this.getConnectedUsers(),
      currentStreamerId: this.currentStreamerId,
    };
  }

  private getClientById(clientId: string) {
    const socket = this.socketsByClientId.get(clientId);

    if (!socket) {
      return null;
    }

    return this.clients.get(socket) ?? null;
  }

  private getConnectedUsers(): ConnectedUser[] {
    return [...this.clients.values()]
      .filter((client) => client.nickname.length > 0)
      .map((client) => this.toConnectedUser(client));
  }

  private toConnectedUser(client: ClientRecord): ConnectedUser {
    return {
      id: client.id,
      nickname: client.nickname,
    };
  }
}
