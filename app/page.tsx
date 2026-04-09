import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#0F172A]">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(245,158,11,0.2),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(251,191,36,0.18),transparent_36%)]" />
        <div className="relative mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-center px-4 py-20">
          <p className="mb-4 inline-flex w-fit rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-400">
            Skill Exchange Platform
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Exchange Skills, Grow Together
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Teach what you know. Learn what you don&apos;t. Connect with people who have the skills you need.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-6 py-3 font-semibold text-black transition hover:bg-amber-400">
              Get Started Free
            </Link>
            <Link href="/browse" className="inline-flex items-center justify-center rounded-lg border border-amber-500 bg-transparent px-6 py-3 font-semibold text-amber-400 transition hover:border-amber-400 hover:text-amber-300">
              Browse Skills
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-semibold text-white">How It Works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
            <p className="text-sm font-semibold text-amber-500">Step 1</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Create Your Profile</h3>
            <p className="mt-3 text-slate-300">List skills you offer and skills you want.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
            <p className="text-sm font-semibold text-amber-500">Step 2</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Find Your Match</h3>
            <p className="mt-3 text-slate-300">Our system matches you with the perfect swap partner.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
            <p className="text-sm font-semibold text-amber-500">Step 3</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Exchange &amp; Grow</h3>
            <p className="mt-3 text-slate-300">Meet online or offline and learn together.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <h2 className="text-3xl font-semibold text-white">Features</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
            <h3 className="text-lg font-semibold text-white">Skill Exchange</h3>
            <p className="mt-2 text-slate-300">Trade skills peer to peer.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
            <h3 className="text-lg font-semibold text-white">Skill Analysis</h3>
            <p className="mt-2 text-slate-300">AI analyzes your profile and suggests improvements.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
            <h3 className="text-lg font-semibold text-white">Company Tasks</h3>
            <p className="mt-2 text-slate-300">Complete real tasks, get scored, get hired.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#1E293B] p-5">
            <h3 className="text-lg font-semibold text-white">Teach &amp; Earn</h3>
            <p className="mt-2 text-slate-300">Monetize your expertise as a premium teacher.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-4 rounded-2xl border border-slate-700 bg-[#1E293B] p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-3xl font-bold text-amber-400">2,400+</p>
            <p className="mt-1 text-slate-300">Skills Listed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-400">1,800+</p>
            <p className="mt-1 text-slate-300">Active Users</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-400">950+</p>
            <p className="mt-1 text-slate-300">Successful Swaps</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-400">4.9</p>
            <p className="mt-1 text-slate-300">Star Rating</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">SkillSwap</p>
            <p className="text-sm text-slate-400">Exchange skills, unlock opportunities.</p>
          </div>
          <div className="flex gap-5 text-sm text-slate-300">
            <Link href="/" className="text-amber-400 hover:text-amber-300">About</Link>
            <Link href="/browse" className="text-amber-400 hover:text-amber-300">Browse</Link>
            <Link href="/register" className="text-amber-400 hover:text-amber-300">Register</Link>
            <Link href="/login" className="text-amber-400 hover:text-amber-300">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
