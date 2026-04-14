"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";

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
    "connected" | "disconnected"
  >("connected");

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      return;
    }

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
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(209,250,229,0.6)_0,_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(191,219,254,0.45)_0,_transparent_30%),linear-gradient(180deg,_#f8faf6_0%,_#edf3ef_100%)] px-6 py-10 text-slate-900 sm:px-8">
        <section className="w-full max-w-md rounded-[30px] border border-white/70 bg-white/88 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur sm:p-9">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <input
                autoComplete="off"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
    <main className="grid min-h-screen grid-cols-1 bg-[radial-gradient(circle_at_top,_rgba(209,250,229,0.55)_0,_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(191,219,254,0.42)_0,_transparent_32%),linear-gradient(180deg,_#f8faf6_0%,_#edf3ef_100%)] text-slate-900 md:grid-cols-[300px_1fr]">
      <aside className="flex flex-col gap-8 border-b border-white/70 bg-white/72 px-4 py-6 backdrop-blur md:border-r md:border-b-0 md:px-6 md:py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Users</h2>
          <span className="text-sm text-slate-500">
            {users.length} online
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {connectionStatus}
          </span>
        </div>

        <div className="space-y-3.5">
          {users.length > 0 ? (
            users.map((user) => {
              const isCurrentUser = user.id === selfId;

              return (
                <div
                  key={user.id}
                  className="rounded-2xl border border-white/80 bg-slate-50/75 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {user.nickname}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-500">
                    {isCurrentUser ? "You" : "Connected"}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/70 p-6">
              <p className="text-center leading-6 text-slate-500">
                {connectionStatus === "disconnected"
                  ? "Backend not connected."
                  : "No users connected yet."}
              </p>
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-h-[50vh] items-center justify-center px-6 py-10 md:min-h-screen md:px-10">
        <button
          className="w-full max-w-80 rounded-full bg-linear-to-r from-slate-950 via-slate-900 to-emerald-800 px-8 py-4 text-base font-bold tracking-[0.01em] text-white shadow-[0_20px_44px_rgba(5,150,105,0.18)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          type="button"
        >
          Share your screen
        </button>
      </section>
    </main>
  );
}
