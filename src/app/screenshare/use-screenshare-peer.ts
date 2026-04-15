"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  serializeDescription,
  serializeIceCandidate,
  toRtcIceCandidateInit,
} from "./webrtc";
import type {
  ClientMessage,
  ShareStatus,
  WebRtcAnswerRelayMessage,
  WebRtcIceCandidateRelayMessage,
  WebRtcOfferRelayMessage,
} from "./types";

type UseScreensharePeerOptions = {
  currentStreamerIdRef: RefObject<string | null>;
  selfIdRef: RefObject<string | null>;
  sendMessage: (message: ClientMessage) => void;
};

type UseScreensharePeerResult = {
  clearRemoteStream: () => void;
  closeAllPeerConnections: () => void;
  handleAnswer: (message: WebRtcAnswerRelayMessage) => Promise<void>;
  handleIceCandidate: (
    message: WebRtcIceCandidateRelayMessage,
  ) => Promise<void>;
  handleOffer: (message: WebRtcOfferRelayMessage) => Promise<void>;
  remoteStream: MediaStream | null;
  shareStatus: ShareStatus;
  startOrStopSharing: () => Promise<void>;
  startViewingStream: (streamerId: string) => Promise<void>;
  stopLocalShare: (notifyServer: boolean) => void;
  streamError: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function useScreensharePeer({
  currentStreamerIdRef,
  selfIdRef,
  sendMessage,
}: UseScreensharePeerOptions): UseScreensharePeerResult {
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceCandidatesRef = useRef(
    new Map<string, RTCIceCandidateInit[]>(),
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shareStatusRef = useRef<ShareStatus>("idle");
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    shareStatusRef.current = shareStatus;
  }, [shareStatus]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;

    if (videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const clearRemoteStream = useCallback(() => {
    if (remoteStreamRef.current) {
      for (const track of remoteStreamRef.current.getTracks()) {
        track.stop();
      }
    }

    setRemoteStream(null);
  }, []);

  const closePeerConnection = useCallback((remoteId: string) => {
    const peerConnection = peerConnectionsRef.current.get(remoteId);

    if (!peerConnection) {
      return;
    }

    peerConnection.onicecandidate = null;
    peerConnection.ontrack = null;
    peerConnection.close();
    peerConnectionsRef.current.delete(remoteId);
    pendingIceCandidatesRef.current.delete(remoteId);
  }, []);

  const closeAllPeerConnections = useCallback(() => {
    for (const remoteId of peerConnectionsRef.current.keys()) {
      closePeerConnection(remoteId);
    }
  }, [closePeerConnection]);

  const stopLocalShare = useCallback(
    (notifyServer: boolean) => {
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          track.stop();
        }

        localStreamRef.current = null;
      }

      closeAllPeerConnections();
      setShareStatus("idle");

      if (notifyServer) {
        sendMessage({ type: "stream:stop" });
      }
    },
    [closeAllPeerConnections, sendMessage],
  );

  const createPeerConnection = useCallback(
    (remoteId: string, mode: "viewer" | "streamer") => {
      closePeerConnection(remoteId);

      const peerConnection = new RTCPeerConnection();

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }

        sendMessage({
          type: "webrtc:ice-candidate",
          targetId: remoteId,
          candidate: serializeIceCandidate(event.candidate),
        });
      };

      peerConnection.onconnectionstatechange = () => {
        if (
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "closed"
        ) {
          closePeerConnection(remoteId);

          if (mode === "viewer") {
            clearRemoteStream();
          }
        }
      };

      if (mode === "viewer") {
        peerConnection.addTransceiver("video", { direction: "recvonly" });
        peerConnection.ontrack = (event) => {
          const [stream] = event.streams;

          if (stream) {
            setRemoteStream(stream);
          }
        };
      } else {
        const localStream = localStreamRef.current;

        if (localStream) {
          for (const track of localStream.getTracks()) {
            peerConnection.addTrack(track, localStream);
          }
        }
      }

      peerConnectionsRef.current.set(remoteId, peerConnection);

      return peerConnection;
    },
    [clearRemoteStream, closePeerConnection, sendMessage],
  );

  const flushPendingIceCandidates = useCallback(async (remoteId: string) => {
    const peerConnection = peerConnectionsRef.current.get(remoteId);
    const pendingCandidates = pendingIceCandidatesRef.current.get(remoteId);

    if (!peerConnection || !pendingCandidates || pendingCandidates.length === 0) {
      return;
    }

    pendingIceCandidatesRef.current.delete(remoteId);

    for (const candidate of pendingCandidates) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const startViewingStream = useCallback(
    async (streamerId: string) => {
      if (!selfIdRef.current || streamerId === selfIdRef.current) {
        return;
      }

      if (peerConnectionsRef.current.has(streamerId)) {
        return;
      }

      const peerConnection = createPeerConnection(streamerId, "viewer");
      const offer = await peerConnection.createOffer();
      const localDescription = serializeDescription(offer);

      if (!localDescription) {
        return;
      }

      await peerConnection.setLocalDescription(offer);

      sendMessage({
        type: "webrtc:offer",
        targetId: streamerId,
        sdp: localDescription,
      });
    },
    [createPeerConnection, selfIdRef, sendMessage],
  );

  const handleOffer = useCallback(
    async (message: WebRtcOfferRelayMessage) => {
      if (!localStreamRef.current || shareStatusRef.current !== "sharing") {
        return;
      }

      const peerConnection = createPeerConnection(message.fromId, "streamer");

      await peerConnection.setRemoteDescription(message.sdp);
      await flushPendingIceCandidates(message.fromId);

      const answer = await peerConnection.createAnswer();
      const localDescription = serializeDescription(answer);

      if (!localDescription) {
        return;
      }

      await peerConnection.setLocalDescription(answer);

      sendMessage({
        type: "webrtc:answer",
        targetId: message.fromId,
        sdp: localDescription,
      });
    },
    [createPeerConnection, flushPendingIceCandidates, sendMessage],
  );

  const handleAnswer = useCallback(
    async (message: WebRtcAnswerRelayMessage) => {
      const peerConnection = peerConnectionsRef.current.get(message.fromId);

      if (!peerConnection) {
        return;
      }

      await peerConnection.setRemoteDescription(message.sdp);
      await flushPendingIceCandidates(message.fromId);
    },
    [flushPendingIceCandidates],
  );

  const handleIceCandidate = useCallback(
    async (message: WebRtcIceCandidateRelayMessage) => {
      const peerConnection = peerConnectionsRef.current.get(message.fromId);

      if (!peerConnection) {
        return;
      }

      try {
        const candidate = toRtcIceCandidateInit(message.candidate);

        if (!peerConnection.remoteDescription) {
          const pendingCandidates =
            pendingIceCandidatesRef.current.get(message.fromId) ?? [];

          pendingCandidates.push(candidate);
          pendingIceCandidatesRef.current.set(message.fromId, pendingCandidates);
          return;
        }

        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        closePeerConnection(message.fromId);

        if (message.fromId === currentStreamerIdRef.current) {
          clearRemoteStream();
        }
      }
    },
    [clearRemoteStream, closePeerConnection, currentStreamerIdRef],
  );

  useEffect(() => {
    return () => {
      closeAllPeerConnections();
      clearRemoteStream();
      stopLocalShare(false);
    };
  }, [clearRemoteStream, closeAllPeerConnections, stopLocalShare]);

  const startOrStopSharing = useCallback(async () => {
    if (shareStatusRef.current === "sharing") {
      stopLocalShare(true);
      return;
    }

    if (
      shareStatusRef.current === "starting" ||
      !selfIdRef.current ||
      (currentStreamerIdRef.current &&
        currentStreamerIdRef.current !== selfIdRef.current)
    ) {
      return;
    }

    setShareStatus("starting");
    setStreamError(null);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      localStreamRef.current = stream;
      currentStreamerIdRef.current = selfIdRef.current;

      const [videoTrack] = stream.getVideoTracks();

      if (videoTrack) {
        videoTrack.addEventListener(
          "ended",
          () => {
            if (shareStatusRef.current === "sharing") {
              stopLocalShare(true);
            }
          },
          { once: true },
        );
      }

      setShareStatus("sharing");
      sendMessage({ type: "stream:start" });
    } catch {
      setShareStatus("idle");
      setStreamError("Screen sharing was cancelled or unavailable.");
    }
  }, [currentStreamerIdRef, selfIdRef, sendMessage, stopLocalShare]);

  return {
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
  };
}
