"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";

type ConnectedUser = {
  id: string;
  nickname: string;
};

type SessionDescriptionPayload = {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp: string;
};

type IceCandidatePayload = {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment?: string | null;
};

type JoinedMessage = {
  type: "joined";
  user: ConnectedUser;
};

type UsersUpdateMessage = {
  type: "users:update";
  users: ConnectedUser[];
  currentStreamerId: string | null;
};

type WebRtcOfferRelayMessage = {
  type: "webrtc:offer";
  fromId: string;
  sdp: SessionDescriptionPayload;
};

type WebRtcAnswerRelayMessage = {
  type: "webrtc:answer";
  fromId: string;
  sdp: SessionDescriptionPayload;
};

type WebRtcIceCandidateRelayMessage = {
  type: "webrtc:ice-candidate";
  fromId: string;
  candidate: IceCandidatePayload;
};

type ServerMessage =
  | JoinedMessage
  | UsersUpdateMessage
  | WebRtcOfferRelayMessage
  | WebRtcAnswerRelayMessage
  | WebRtcIceCandidateRelayMessage;

type ClientMessage =
  | {
      type: "join";
      nickname: string;
    }
  | {
      type: "stream:start";
    }
  | {
      type: "stream:stop";
    }
  | {
      type: "webrtc:offer";
      targetId: string;
      sdp: SessionDescriptionPayload;
    }
  | {
      type: "webrtc:answer";
      targetId: string;
      sdp: SessionDescriptionPayload;
    }
  | {
      type: "webrtc:ice-candidate";
      targetId: string;
      candidate: IceCandidatePayload;
    };

const SIGNALING_URL =
  process.env.NEXT_PUBLIC_SIGNALING_URL ?? "ws://localhost:8080";

const serializeDescription = (
  description: RTCSessionDescriptionInit | RTCSessionDescription,
): SessionDescriptionPayload | null => {
  if (!description.type || !description.sdp) {
    return null;
  }

  return {
    type: description.type,
    sdp: description.sdp,
  };
};

const serializeIceCandidate = (
  candidate: RTCIceCandidate,
): IceCandidatePayload => {
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment,
  };
};

const toRtcIceCandidateInit = (
  candidate: IceCandidatePayload,
): RTCIceCandidateInit => {
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment,
  };
};

export default function ScreenshareClient() {
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceCandidatesRef = useRef(
    new Map<string, RTCIceCandidateInit[]>(),
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const currentStreamerIdRef = useRef<string | null>(null);
  const shareStatusRef = useRef<"idle" | "starting" | "sharing">("idle");
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const previousStreamerIdRef = useRef<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [joinedNickname, setJoinedNickname] = useState("");
  const [selfId, setSelfId] = useState<string | null>(null);
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [currentStreamerId, setCurrentStreamerId] = useState<string | null>(
    null,
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected"
  >("connected");
  const [shareStatus, setShareStatus] = useState<"idle" | "starting" | "sharing">(
    "idle",
  );
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    selfIdRef.current = selfId;
  }, [selfId]);

  useEffect(() => {
    currentStreamerIdRef.current = currentStreamerId;
  }, [currentStreamerId]);

  useEffect(() => {
    shareStatusRef.current = shareStatus;
  }, [shareStatus]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;

    if (videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const sendMessage = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }, []);

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

  const stopLocalShare = useCallback((notifyServer: boolean) => {
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
  }, [closeAllPeerConnections, sendMessage]);

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

  const startViewingStream = useCallback(async (streamerId: string) => {
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
  }, [createPeerConnection, sendMessage]);

  const handleOffer = useEffectEvent(async (message: WebRtcOfferRelayMessage) => {
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
  });

  const handleAnswer = useEffectEvent(
    async (message: WebRtcAnswerRelayMessage) => {
      const peerConnection = peerConnectionsRef.current.get(message.fromId);

      if (!peerConnection) {
        return;
      }

      await peerConnection.setRemoteDescription(message.sdp);
      await flushPendingIceCandidates(message.fromId);
    },
  );

  const handleIceCandidate = useEffectEvent(
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
  );

  const handleUsersUpdate = useEffectEvent((message: UsersUpdateMessage) => {
    const previousStreamerId = previousStreamerIdRef.current;

    if (
      previousStreamerId &&
      previousStreamerId !== message.currentStreamerId &&
      previousStreamerId !== selfIdRef.current
    ) {
      closePeerConnection(previousStreamerId);
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

  useEffect(() => {
    return () => {
      closeAllPeerConnections();
      clearRemoteStream();
      stopLocalShare(false);
    };
  }, [clearRemoteStream, closeAllPeerConnections, stopLocalShare]);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      return;
    }

    setSelfId(null);
    setUsers([]);
    setCurrentStreamerId(null);
    setJoinedNickname(trimmedNickname);
    setStreamError(null);
  };

  const handleShareClick = async () => {
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
  };

  const isSelfStreamer = currentStreamerId === selfId && shareStatus === "sharing";
  const isAnotherStreamerActive =
    currentStreamerId !== null && currentStreamerId !== selfId;
  const streamer = users.find((user) => user.id === currentStreamerId) ?? null;
  const shareButtonLabel = isSelfStreamer
    ? "Stop sharing"
    : isAnotherStreamerActive
      ? `${streamer?.nickname ?? "Someone"} is sharing`
      : shareStatus === "starting"
        ? "Starting..."
        : "Share your screen";

  if (!joinedNickname) {
    return (
      <main className="screenshare-auth-bg flex min-h-screen items-center justify-center px-6 py-10 text-slate-100 sm:px-8">
        <section className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#101a18]/88 p-7 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur sm:p-9">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <input
                autoComplete="off"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:bg-white/8 focus:ring-4 focus:ring-emerald-500/20"
                name="nickname"
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Enter your nickname"
                value={nickname}
              />
            </label>

            <button
              className="w-full rounded-full bg-linear-to-r from-slate-950 via-slate-900 to-emerald-800 px-6 py-3.5 text-sm font-bold tracking-[0.01em] text-white shadow-[0_18px_40px_rgba(5,150,105,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
              type="submit"
            >
              Continue
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="screenshare-app-bg grid min-h-screen grid-cols-1 text-slate-100 md:grid-cols-[300px_1fr]">
      <aside className="flex flex-col gap-8 border-b border-white/8 bg-[#0e1715]/82 px-4 py-6 backdrop-blur md:border-b-0 md:px-6 md:py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Users</h2>
          <span className="text-sm text-slate-400">{users.length} online</span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300/75">
            {connectionStatus}
          </span>
        </div>

        <div className="space-y-3.5">
          {users.length > 0 ? (
            users.map((user) => {
              const isCurrentUser = user.id === selfId;
              const isStreamer = user.id === currentStreamerId;

              return (
                <div
                  key={user.id}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {user.nickname}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-400">
                    {isStreamer
                      ? isCurrentUser
                        ? "You are sharing"
                        : "Sharing now"
                      : isCurrentUser
                        ? "You"
                        : "Connected"}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/4 p-6">
              <p className="text-center leading-6 text-slate-400">
                {connectionStatus === "disconnected"
                  ? "Backend not connected."
                  : "No users connected yet."}
              </p>
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-h-[50vh] flex-col items-center justify-center gap-6 border-t border-white/8 px-6 py-10 shadow-[-24px_0_48px_rgba(0,0,0,0.2)] md:min-h-screen md:border-t-0 md:border-l md:border-white/8 md:px-10">
        <div className="flex w-full max-w-4xl flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">
                Live screen
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {isSelfStreamer
                  ? "Your screen is being shared with connected viewers."
                  : streamer
                    ? `${streamer.nickname} is currently sharing.`
                    : "Nobody is sharing yet."}
              </p>
            </div>

            <button
              className="w-full max-w-80 rounded-full bg-linear-to-r from-slate-950 via-slate-900 to-emerald-800 px-8 py-4 text-base font-bold tracking-[0.01em] text-white shadow-[0_20px_44px_rgba(5,150,105,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
              disabled={
                connectionStatus === "disconnected" ||
                shareStatus === "starting" ||
                isAnotherStreamerActive
              }
              onClick={() => {
                void handleShareClick();
              }}
              type="button"
            >
              {shareButtonLabel}
            </button>
          </div>

          {streamError ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {streamError}
            </div>
          ) : null}
        </div>

        <div className="flex w-full max-w-4xl flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#08110f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
          {remoteStream ? (
            <video
              ref={videoRef}
              autoPlay
              className="h-full min-h-[340px] w-full bg-black object-contain"
              muted
              playsInline
            />
          ) : (
            <div className="flex min-h-[340px] w-full max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-lg font-semibold text-slate-100">
                {isSelfStreamer
                  ? "Your screen is live."
                  : streamer
                    ? `Waiting for ${streamer.nickname}'s stream...`
                    : "Screen share will appear here."}
              </p>
              <p className="text-sm leading-6 text-slate-400">
                {isSelfStreamer
                  ? "Other connected users will receive the stream automatically."
                  : streamer
                    ? "The viewer connection is established automatically when the stream is available."
                    : "One connected user can start sharing, and everyone else will watch here."}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
