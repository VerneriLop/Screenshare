export type ConnectedUser = {
  id: string;
  nickname: string;
};

export type ConnectionStatus = "connected" | "disconnected";

export type ShareStatus = "idle" | "starting" | "sharing";

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

export type ClientMessage =
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
