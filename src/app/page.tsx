"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ConnectedUser = {
  id: string;
  nickname: string;
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

type ServerMessage = JoinedMessage | UsersUpdateMessage;

const SIGNALING_URL =
  process.env.NEXT_PUBLIC_SIGNALING_URL ?? "ws://localhost:8080";

export default function Home() {
  const socketRef = useRef<WebSocket | null>(null);
  const [nickname, setNickname] = useState("");
  const [joinedNickname, setJoinedNickname] = useState("");
  const [selfId, setSelfId] = useState<string | null>(null);
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "disconnected"
  >("idle");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      return;
    }

    setConnectionStatus("connecting");
    setSelfId(null);
    setUsers([]);
    setJoinedNickname(trimmedNickname);
  };

  useEffect(() => {
    if (!joinedNickname) {
      return;
    }

    const socket = new WebSocket(SIGNALING_URL);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
      socket.send(
        JSON.stringify({
          type: "join",
          nickname: joinedNickname,
        }),
      );
    });

    socket.addEventListener("message", (event) => {
      let message: ServerMessage;

      try {
        message = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }

      if (message.type === "joined") {
        setSelfId(message.user.id);
      }

      if (message.type === "users:update") {
        setUsers(message.users);
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");

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
  }, [joinedNickname]);

  if (!joinedNickname) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#f5f7fb_0,_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-6 text-slate-900">
        <section className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <input
                autoComplete="off"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                name="nickname"
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Enter your nickname"
                value={nickname}
              />
            </label>

            <button
              className="w-full rounded-full bg-linear-to-br from-slate-950 to-blue-700 px-6 py-3 text-sm font-bold tracking-[0.01em] text-slate-50 shadow-[0_18px_40px_rgba(29,78,216,0.22)] transition hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
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
    <main className="grid min-h-screen grid-cols-1 bg-[radial-gradient(circle_at_top_left,_#f5f7fb_0,_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-900 md:grid-cols-[280px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-slate-200/80 bg-white/80 p-5 backdrop-blur md:border-r md:border-b-0 md:p-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-bold">Users</h2>
          <span className="text-sm text-slate-500">
            {users.length} online
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            {connectionStatus}
          </span>
        </div>

        <div className="space-y-3">
          {users.length > 0 ? (
            users.map((user) => {
              const isCurrentUser = user.id === selfId;

              return (
                <div
                  key={user.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {user.nickname}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {isCurrentUser ? "You" : "Connected"}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-30 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/90 p-5">
              <p className="text-center leading-6 text-slate-500">
                {connectionStatus === "disconnected"
                  ? "Backend not connected."
                  : "No users connected yet."}
              </p>
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-h-[50vh] items-center justify-center p-6 md:min-h-screen md:p-8">
        <button
          className="w-full max-w-80 rounded-full bg-linear-to-br from-slate-950 to-blue-700 px-8 py-4 text-base font-bold tracking-[0.01em] text-slate-50 shadow-[0_18px_40px_rgba(29,78,216,0.22)] transition hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          type="button"
        >
          Share your screen
        </button>
      </section>
    </main>
  );
}
