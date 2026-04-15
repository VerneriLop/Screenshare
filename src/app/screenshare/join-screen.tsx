import type { SyntheticEvent } from "react";

type JoinScreenProps = {
  nickname: string;
  onNicknameChange: (value: string) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
};

export function JoinScreen({
  nickname,
  onNicknameChange,
  onSubmit,
}: JoinScreenProps) {
  return (
    <main className="screenshare-auth-bg flex min-h-screen items-center justify-center px-6 py-10 text-slate-100 sm:px-8">
      <section className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#101a18]/88 p-7 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur sm:p-9">
        <form className="space-y-5" onSubmit={onSubmit}>
          <label className="block">
            <input
              autoComplete="off"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:bg-white/8 focus:ring-4 focus:ring-emerald-500/20"
              name="nickname"
              onChange={(event) => onNicknameChange(event.target.value)}
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
