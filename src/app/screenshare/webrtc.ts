import type { IceCandidatePayload, SessionDescriptionPayload } from "./types";

export const serializeDescription = (
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

export const serializeIceCandidate = (
  candidate: RTCIceCandidate,
): IceCandidatePayload => {
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment,
  };
};

export const toRtcIceCandidateInit = (
  candidate: IceCandidatePayload,
): RTCIceCandidateInit => {
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment,
  };
};
