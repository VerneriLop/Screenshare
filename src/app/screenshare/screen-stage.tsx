import type { RefObject } from "react";

import type { ConnectedUser } from "./types";

type ScreenStageProps = {
  connectionStatus: "connected" | "disconnected";
  currentStreamerId: string | null;
  remoteStream: MediaStream | null;
  selfId: string | null;
  shareStatus: "idle" | "starting" | "sharing";
  streamError: string | null;
  users: ConnectedUser[];
  videoRef: RefObject<HTMLVideoElement | null>;
  onShareClick: () => void;
};

export function ScreenStage({
  connectionStatus,
  currentStreamerId,
  remoteStream,
  selfId,
  shareStatus,
  streamError,
  users,
  videoRef,
  onShareClick,
}: ScreenStageProps) {
  const isSelfStreamer =
    currentStreamerId === selfId && shareStatus === "sharing";
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

  return (
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
            onClick={onShareClick}
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
            className="h-full min-h-85 w-full bg-black object-contain"
            muted
            playsInline
          />
        ) : (
          <div className="flex min-h-85 w-full max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
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
  );
}
