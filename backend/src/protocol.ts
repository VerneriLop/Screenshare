export type ConnectedUser = {
  id: string;
  nickname: string;
};

export type SessionDescriptionPayload = {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp: string;
};

export type IceCandidatePayload = {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment?: string | null;
};

export type JoinMessage = {
  type: "join";
  nickname: string;
};

export type StreamStartMessage = {
  type: "stream:start";
};

export type StreamStopMessage = {
  type: "stream:stop";
};

export type WebRtcOfferMessage = {
  type: "webrtc:offer";
  targetId: string;
  sdp: SessionDescriptionPayload;
};

export type WebRtcAnswerMessage = {
  type: "webrtc:answer";
  targetId: string;
  sdp: SessionDescriptionPayload;
};

export type WebRtcIceCandidateMessage = {
  type: "webrtc:ice-candidate";
  targetId: string;
  candidate: IceCandidatePayload;
};

export type ClientMessage =
  | JoinMessage
  | StreamStartMessage
  | StreamStopMessage
  | WebRtcOfferMessage
  | WebRtcAnswerMessage
  | WebRtcIceCandidateMessage;

export type JoinedMessage = {
  type: "joined";
  user: ConnectedUser;
};

export type UsersUpdateMessage = {
  type: "users:update";
  users: ConnectedUser[];
  currentStreamerId: string | null;
};

export type WebRtcOfferRelayMessage = {
  type: "webrtc:offer";
  fromId: string;
  sdp: SessionDescriptionPayload;
};

export type WebRtcAnswerRelayMessage = {
  type: "webrtc:answer";
  fromId: string;
  sdp: SessionDescriptionPayload;
};

export type WebRtcIceCandidateRelayMessage = {
  type: "webrtc:ice-candidate";
  fromId: string;
  candidate: IceCandidatePayload;
};

export type ServerMessage =
  | JoinedMessage
  | UsersUpdateMessage
  | WebRtcOfferRelayMessage
  | WebRtcAnswerRelayMessage
  | WebRtcIceCandidateRelayMessage;

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isSessionDescriptionPayload = (
  value: unknown,
): value is SessionDescriptionPayload => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.sdp === "string" &&
    (value.type === "offer" ||
      value.type === "answer" ||
      value.type === "pranswer" ||
      value.type === "rollback")
  );
};

const isIceCandidatePayload = (value: unknown): value is IceCandidatePayload => {
  if (!isObject(value)) {
    return false;
  }

  const hasUsernameFragment =
    value.usernameFragment === undefined ||
    value.usernameFragment === null ||
    typeof value.usernameFragment === "string";

  return (
    typeof value.candidate === "string" &&
    (value.sdpMid === null || typeof value.sdpMid === "string") &&
    (value.sdpMLineIndex === null ||
      typeof value.sdpMLineIndex === "number") &&
    hasUsernameFragment
  );
};

export const parseClientMessage = (rawMessage: string): ClientMessage | null => {
  let message: unknown;

  try {
    message = JSON.parse(rawMessage);
  } catch {
    return null;
  }

  if (!isObject(message) || typeof message.type !== "string") {
    return null;
  }

  if (message.type === "join") {
    const nickname =
      typeof message.nickname === "string" ? message.nickname.trim() : "";

    if (!nickname) {
      return null;
    }

    return {
      type: "join",
      nickname,
    };
  }

  if (message.type === "stream:start" || message.type === "stream:stop") {
    return {
      type: message.type,
    };
  }

  if (
    (message.type === "webrtc:offer" || message.type === "webrtc:answer") &&
    typeof message.targetId === "string" &&
    isSessionDescriptionPayload(message.sdp)
  ) {
    return {
      type: message.type,
      targetId: message.targetId,
      sdp: message.sdp,
    };
  }

  if (
    message.type === "webrtc:ice-candidate" &&
    typeof message.targetId === "string" &&
    isIceCandidatePayload(message.candidate)
  ) {
    return {
      type: "webrtc:ice-candidate",
      targetId: message.targetId,
      candidate: message.candidate,
    };
  }

  return null;
};
