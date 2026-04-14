export default function Home() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-[radial-gradient(circle_at_top_left,_#f5f7fb_0,_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-900 md:grid-cols-[280px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-slate-200/80 bg-white/80 p-5 backdrop-blur md:border-r md:border-b-0 md:p-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-bold">Users</h2>
          <span className="text-sm text-slate-500">0 online</span>
        </div>

        <div className="flex min-h-30 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/90 p-5">
          <p className="text-center leading-6 text-slate-500">
            No users connected yet.
          </p>
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
