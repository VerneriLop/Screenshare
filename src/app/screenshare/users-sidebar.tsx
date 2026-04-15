import type { ConnectedUser } from "./types";

type UsersSidebarProps = {
  connectionStatus: "connected" | "disconnected";
  currentStreamerId: string | null;
  selfId: string | null;
  users: ConnectedUser[];
};

export function UsersSidebar({
  connectionStatus,
  currentStreamerId,
  selfId,
  users,
}: UsersSidebarProps) {
  return (
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
  );
}
