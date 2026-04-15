"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import type {
  ClientMessage,
  ConnectionStatus,
  ConnectedUser,
  ServerMessage,
  ShareStatus,
  UsersUpdateMessage,
} from "./types";
import { useScreensharePeer } from "./use-screenshare-peer";

const SIGNALING_URL =
  process.env.NEXT_PUBLIC_SIGNALING_URL ?? "ws://localhost:8080";

type UseScreenshareRoomResult = {
  connectionStatus: ConnectionStatus;
  currentStreamerId: string | null;
  joinRoom: (nickname: string) => void;
  joinedNickname: string;
  remoteStream: MediaStream | null;
  selfId: string | null;
  shareStatus: ShareStatus;
  startOrStopSharing: () => Promise<void>;
  streamError: string | null;
  users: ConnectedUser[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

export function useScreenshareRoom(): UseScreenshareRoomResult {
  const socketRef = useRef<WebSocket | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const currentStreamerIdRef = useRef<string | null>(null);
  const previousStreamerIdRef = useRef<string | null>(null);
  const [joinedNickname, setJoinedNickname] = useState("");
  const [selfId, setSelfId] = useState<string | null>(null);
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [currentStreamerId, setCurrentStreamerId] = useState<string | null>(
    null,
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connected");

  useEffect(() => {
    selfIdRef.current = selfId;
  }, [selfId]);

  useEffect(() => {
    currentStreamerIdRef.current = currentStreamerId;
  }, [currentStreamerId]);

  const sendMessage = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }, []);

  const {
    clearRemoteStream,
    closeAllPeerConnections,
    handleAnswer,
    handleIceCandidate,
    handleOffer,
    remoteStream,
    shareStatus,
    startOrStopSharing,
    startViewingStream,
    stopLocalShare,
    streamError,
    videoRef,
  } = useScreensharePeer({
    currentStreamerIdRef,
    selfIdRef,
    sendMessage,
  });

  const handleUsersUpdate = useEffectEvent((message: UsersUpdateMessage) => {
    const previousStreamerId = previousStreamerIdRef.current;

    if (
      previousStreamerId &&
      previousStreamerId !== message.currentStreamerId &&
      previousStreamerId !== selfIdRef.current
    ) {
      closeAllPeerConnections();
      clearRemoteStream();
    }

    previousStreamerIdRef.current = message.currentStreamerId;
    currentStreamerIdRef.current = message.currentStreamerId;
    setUsers(message.users);
    setCurrentStreamerId(message.currentStreamerId);
  });

  const handleSocketMessage = useEffectEvent(async (event: MessageEvent<string>) => {
    let message: ServerMessage;

    try {
      message = JSON.parse(event.data) as ServerMessage;
    } catch {
      return;
    }

    if (message.type === "joined") {
      selfIdRef.current = message.user.id;
      setSelfId(message.user.id);
      return;
    }

    if (message.type === "users:update") {
      handleUsersUpdate(message);
      return;
    }

    if (message.type === "webrtc:offer") {
      await handleOffer(message);
      return;
    }

    if (message.type === "webrtc:answer") {
      await handleAnswer(message);
      return;
    }

    await handleIceCandidate(message);
  });

  useEffect(() => {
    if (!joinedNickname) {
      return;
    }

    const socket = new WebSocket(SIGNALING_URL);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
      sendMessage({
        type: "join",
        nickname: joinedNickname,
      });
    });

    socket.addEventListener("message", (event) => {
      void handleSocketMessage(event as MessageEvent<string>);
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");
      closeAllPeerConnections();
      clearRemoteStream();
      stopLocalShare(false);

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    });

    socket.addEventListener("error", () => {
      setConnectionStatus("disconnected");
    });

    return () => {
      socket.close();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    clearRemoteStream,
    closeAllPeerConnections,
    joinedNickname,
    sendMessage,
    stopLocalShare,
  ]);

  useEffect(() => {
    if (!selfId || !currentStreamerId || currentStreamerId === selfId) {
      return;
    }

    void startViewingStream(currentStreamerId);
  }, [currentStreamerId, selfId, startViewingStream]);

  const joinRoom = useCallback((nickname: string) => {
    setSelfId(null);
    setUsers([]);
    setCurrentStreamerId(null);
    setJoinedNickname(nickname);
  }, []);

  return {
    connectionStatus,
    currentStreamerId,
    joinRoom,
    joinedNickname,
    remoteStream,
    selfId,
    shareStatus,
    startOrStopSharing,
    streamError,
    users,
    videoRef,
  };
}
