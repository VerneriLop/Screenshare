"use client";

import { useState, type SyntheticEvent } from "react";

import { JoinScreen } from "./screenshare/join-screen";
import { ScreenStage } from "./screenshare/screen-stage";
import { UsersSidebar } from "./screenshare/users-sidebar";
import { useScreenshareRoom } from "./screenshare/use-screenshare-room";

export default function ScreenshareClient() {
  const [nickname, setNickname] = useState("");
  const {
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
  } = useScreenshareRoom();

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      return;
    }

    joinRoom(trimmedNickname);
  };

  if (!joinedNickname) {
    return (
      <JoinScreen
        nickname={nickname}
        onNicknameChange={setNickname}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <main className="screenshare-app-bg grid min-h-screen grid-cols-1 text-slate-100 md:grid-cols-[300px_1fr]">
      <UsersSidebar
        connectionStatus={connectionStatus}
        currentStreamerId={currentStreamerId}
        selfId={selfId}
        users={users}
      />

      <ScreenStage
        connectionStatus={connectionStatus}
        currentStreamerId={currentStreamerId}
        remoteStream={remoteStream}
        selfId={selfId}
        shareStatus={shareStatus}
        streamError={streamError}
        users={users}
        videoRef={videoRef}
        onShareClick={() => {
          void startOrStopSharing();
        }}
      />
    </main>
  );
}
