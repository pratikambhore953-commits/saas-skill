"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const floatingTags = ["HTML", "CSS", "Python", "Design", "Music", "Business", "React", "Figma", "Public Speaking"];

const stats = [
  { label: "Users", value: 2400, suffix: "+" },
  { label: "Swaps", value: 950, suffix: "+" },
  { label: "Skills", value: 50, suffix: "+" },
  { label: "Rating", value: 4.9, suffix: "★" },
];

function useCountUp(target: number, start: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let frame = 0;
    const duration = 900;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start]);

  return value;
}

export default function Home() {
  const howItWorksRef = useRef<HTMLElement | null>(null);
  const statsRef = useRef<HTMLElement | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const avatars = useMemo(() => ["RS", "PP", "AS", "NM", "KV"], []);

  return (
    <div className="bg-slate-950">
      <section className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(245,158,11,0.2),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(251,191,36,0.16),transparent_30%)]" />

        {floatingTags.map((tag, index) => (
          <motion.span
            key={tag}
            initial={{ y: 0 }}
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 7 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute rounded-full border border-amber-500/35 bg-slate-900/70 px-3 py-1 text-xs text-amber-300"
            style={{ left: `${6 + ((index * 11) % 84)}%`, top: `${14 + ((index * 9) % 70)}%` }}
          >
            {tag}
          </motion.span>
        ))}

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-20">
          <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-7xl">
            Exchange Skills, <br />
            <motion.span
              className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-200 bg-[length:200%_100%] bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            >
              Grow Together
            </motion.span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            Connect with people who have the skills you need. Teach what you know. Learn what you don&apos;t.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-7 py-3 text-base font-semibold text-black hover:bg-amber-400">
              Start Swapping Free
            </Link>
            <button
              type="button"
              onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 px-7 py-3 text-base font-semibold text-white hover:border-amber-400 hover:text-amber-300"
            >
              Watch How It Works
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm text-slate-300">
            <div className="flex">
              {avatars.map((avatar) => (
                <span key={avatar} className="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-900 bg-amber-500 text-xs font-semibold text-black first:ml-0">
                  {avatar}
                </span>
              ))}
            </div>
            Join 2,400+ skill swappers
          </div>
        </div>
      </section>

      <section ref={statsRef} className="bg-gradient-to-r from-amber-500 to-slate-800 py-6">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-5 px-4 text-center text-slate-950 sm:grid-cols-4">
          {stats.map((stat) => (
            <StatCounter key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} active={statsVisible} />
          ))}
        </div>
      </section>

      <section ref={howItWorksRef} id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-20">
        <h2 className="text-center text-4xl font-semibold text-white">Simple as 1, 2, 3</h2>
        <div className="relative mt-12 grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-1/2 top-12 hidden h-px w-[70%] -translate-x-1/2 bg-amber-500/35 md:block" />
          {["Create Profile", "Find Your Match", "Exchange & Grow"].map((title, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1 }}
              className="relative rounded-2xl border border-slate-700 bg-slate-900/70 p-6"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500 text-2xl font-bold text-amber-400">
                {index + 1}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-300">
                {index === 0 && "Set up your profile with skills you teach and skills you want to learn."}
                {index === 1 && "Get matched with people whose goals and strengths complement yours."}
                {index === 2 && "Book sessions, complete exchanges, and level up together."}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="text-center text-4xl font-semibold text-white">Everything You Need to Grow</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            ["Skill Exchange", "Swap skills peer to peer"],
            ["AI Analysis", "Get personalised roadmap"],
            ["Company Tasks", "Complete tasks and get hired"],
            ["Teach & Earn", "Monetize your expertise"],
          ].map(([title, description]) => (
            <article key={title} className="group rounded-2xl border border-slate-700 bg-slate-900/70 p-6 transition hover:-translate-y-1 hover:border-amber-500">
              <p className="text-3xl text-amber-400">✦</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <h2 className="text-center text-4xl font-semibold text-white">What Our Users Say</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["Rahul Sharma", "Mumbai", "I learned Python in exchange for teaching HTML. Best platform ever!", "RS"],
            ["Priya Patel", "Pune", "Got hired by a company after completing their task. SkillSwap changed my career!", "PP"],
            ["Arjun Singh", "Bangalore", "The AI analysis showed me exactly what skills to add. My profile score went from 45 to 89!", "AS"],
          ].map(([name, location, quote, initials]) => (
            <article key={name} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 font-semibold text-black">{initials}</span>
                <div>
                  <p className="font-semibold text-white">{name}</p>
                  <p className="text-xs text-slate-400">{location}</p>
                </div>
              </div>
              <p className="mt-3 text-amber-400">★★★★★</p>
              <p className="mt-2 text-sm text-slate-300">“{quote}”</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/70 py-8">
        <p className="text-center text-sm uppercase tracking-[0.2em] text-slate-400">Trusted by companies across India</p>
        <div className="mx-auto mt-4 flex w-full max-w-6xl flex-wrap items-center justify-center gap-3 px-4">
          {["TechCorp", "DesignHub", "StartupX", "InnovateCo", "BuildFast"].map((name) => (
            <span key={name} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 opacity-80">
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="rounded-3xl border border-amber-500 bg-slate-900 p-8 text-center">
          <h2 className="text-4xl font-semibold text-white">Ready to Start Swapping Skills?</h2>
          <p className="mt-3 text-slate-300">Join thousands of learners and teachers on SkillSwap</p>
          <Link href="/register" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-8 py-3 text-base font-semibold text-black hover:bg-amber-400">
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="text-xl font-semibold text-white">SkillSwap</p>
            <p className="mt-2 text-sm text-slate-400">Exchange skills, unlock opportunities.</p>
          </div>
          {[
            ["Product", ["Browse", "Matches", "Sessions"]],
            ["Company", ["About", "Careers", "Contact"]],
            ["Resources", ["Blog", "Help", "Community"]],
            ["Legal", ["Privacy", "Terms", "Cookies"]],
          ].map(([section, links]) => (
            <div key={section as string}>
              <p className="text-sm font-semibold text-white">{section as string}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                {(links as string[]).map((item) => (
                  <li key={item}>
                    <Link href="/" className="hover:text-amber-300">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} SkillSwap. All rights reserved.</p>
      </footer>
    </div>
  );
}

function StatCounter({
  value,
  suffix,
  label,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, active);
  const displayValue = Number.isInteger(value) ? `${Math.round(count)}${suffix}` : `${count.toFixed(1)}${suffix}`;
  return (
    <div>
      <p className="text-3xl font-bold">{displayValue}</p>
      <p className="text-sm font-medium text-slate-900/80">{label}</p>
    </div>
  );
}
