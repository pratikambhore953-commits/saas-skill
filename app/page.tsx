"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const floatingSkills = [
  "HTML",
  "CSS",
  "Python",
  "Design",
  "Music",
  "Business",
  "React",
  "Public Speaking",
  "Data Analysis",
  "Figma",
];

const stats = [
  { label: "Users", value: 2400, suffix: "+" },
  { label: "Swaps", value: 950, suffix: "+" },
  { label: "Skills", value: 50, suffix: "+" },
  { label: "Rating", value: 49, suffix: "★", divideBy10: true },
];

const testimonials = [
  {
    name: "Rahul Sharma",
    location: "Mumbai",
    quote: "I learned Python in exchange for teaching HTML. Best platform ever!",
  },
  {
    name: "Priya Patel",
    location: "Pune",
    quote: "Got hired by a company after completing their task. SkillSwap changed my career!",
  },
  {
    name: "Arjun Singh",
    location: "Bangalore",
    quote: "The AI analysis showed me exactly what skills to add. My profile score went from 45 to 89!",
  },
];

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let rafId = 0;
    const duration = 1100;
    const start = performance.now();

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, target]);

  return value;
}

function StatCounter({
  target,
  suffix,
  active,
  divideBy10,
}: {
  target: number;
  suffix: string;
  active: boolean;
  divideBy10?: boolean;
}) {
  const raw = useCountUp(target, active);
  const value = divideBy10 ? (raw / 10).toFixed(1) : String(raw);

  return (
    <span className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
      {value}
      {suffix}
    </span>
  );
}

export default function Home() {
  const howItWorksRef = useRef<HTMLElement | null>(null);
  const statsRef = useRef<HTMLElement | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    if (!statsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(245,158,11,0.22),transparent_35%),radial-gradient(circle_at_83%_10%,rgba(14,116,144,0.25),transparent_38%),linear-gradient(to_bottom,rgba(2,6,23,0.76),rgba(2,6,23,0.96))]" />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-20 sm:pt-24">
        <div className="max-w-4xl">
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            <span className="block text-white">Exchange Skills,</span>
            <span className="relative mt-2 block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_4s_linear_infinite]">
              Grow Together
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Connect with people who have the skills you need. Teach what you know. Learn what you don&apos;t.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-500 px-7 text-base font-bold text-black transition hover:bg-amber-400"
            >
              Start Swapping Free
            </Link>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-7 text-base font-semibold text-white transition hover:border-amber-300 hover:text-amber-200"
            >
              Watch How It Works
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3">
              {[
                "AK",
                "RM",
                "PP",
                "AS",
                "NV",
              ].map((item, idx) => (
                <span
                  key={item}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-900 bg-slate-200 text-xs font-bold text-slate-800"
                  style={{ zIndex: 6 - idx }}
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-200">Join 2,400+ skill swappers</p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {floatingSkills.map((skill, index) => (
            <motion.div
              key={skill}
              className="absolute rounded-full border border-amber-300/35 bg-slate-900/65 px-3 py-1 text-xs font-semibold text-amber-100"
              style={{
                top: `${14 + (index % 5) * 14}%`,
                left: `${60 + (index % 2) * 18}%`,
              }}
              animate={{
                y: [0, -10, 0],
                x: [0, index % 2 === 0 ? 6 : -6, 0],
              }}
              transition={{
                duration: 4 + (index % 3),
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {skill}
            </motion.div>
          ))}
        </div>
      </section>

      <section ref={statsRef} className="relative border-y border-amber-200/15 bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-300 py-7">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-5 px-4 text-center md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="space-y-1">
              <StatCounter target={item.value} suffix={item.suffix} active={statsVisible} divideBy10={item.divideBy10} />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900/80">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={howItWorksRef} id="how-it-works" className="relative mx-auto w-full max-w-6xl px-4 py-20">
        <h2 className="text-center text-4xl font-black tracking-tight text-white">Simple as 1, 2, 3</h2>
        <div className="relative mt-12 grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-1/2 top-12 hidden h-[2px] w-[64%] -translate-x-1/2 bg-gradient-to-r from-amber-400/0 via-amber-400/70 to-amber-400/0 md:block" />
          {[
            {
              step: "01",
              title: "Create Profile",
              description: "Show what you can teach and what you want to learn.",
              icon: "M12 3v18M3 12h18",
            },
            {
              step: "02",
              title: "Find Your Match",
              description: "Discover people with perfectly complementary skills.",
              icon: "M3 12h18M12 3l4 9-4 9-4-9 4-9Z",
            },
            {
              step: "03",
              title: "Exchange & Grow",
              description: "Book sessions, collaborate, and level up together.",
              icon: "M5 12 10 17 19 7",
            },
          ].map((item, idx) => (
            <motion.article
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: idx * 0.1 }}
              className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 text-center"
            >
              <p className="text-6xl font-black text-transparent [-webkit-text-stroke:1px_#F59E0B]">{item.step}</p>
              <span className="mx-auto mt-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d={item.icon} />
                </svg>
              </span>
              <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="text-center text-4xl font-black tracking-tight text-white">Everything You Need to Grow</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            {
              title: "Skill Exchange",
              description: "Swap skills peer to peer with guided session flows.",
              icon: "M7 7h10v10H7z",
            },
            {
              title: "AI Analysis",
              description: "Get personalised roadmap, gaps, and growth strategy.",
              icon: "M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2Z",
            },
            {
              title: "Company Tasks",
              description: "Complete real tasks, get scored, and get discovered.",
              icon: "M4 6h16v12H4zM8 10h8M8 14h6",
            },
            {
              title: "Teach & Earn",
              description: "Monetize your expertise by teaching what you love.",
              icon: "M12 1v22M6 6h7a3 3 0 1 1 0 6H9a3 3 0 1 0 0 6h9",
            },
          ].map((item) => (
            <motion.article
              key={item.title}
              whileHover={{ y: -6 }}
              className="group rounded-2xl border border-slate-700 bg-slate-900/70 p-6 transition hover:border-amber-400/80"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d={item.icon} />
                </svg>
              </span>
              <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-center text-4xl font-black tracking-tight text-white">What Our Users Say</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">
                  {item.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.location}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-amber-300">★★★★★</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.quote}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6">
        <p className="text-center text-sm uppercase tracking-[0.2em] text-slate-400">Trusted by companies across India</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {["TechCorp", "DesignHub", "StartupX", "InnovateCo", "BuildFast"].map((company) => (
            <span
              key={company}
              className="rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 opacity-85"
            >
              {company}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-amber-500/50 bg-slate-900/85 px-6 py-12 text-center sm:px-10">
          <h2 className="text-4xl font-black tracking-tight text-white">Ready to Start Swapping Skills?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Join thousands of learners and teachers on SkillSwap.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-500 px-7 text-base font-bold text-black transition hover:bg-amber-400"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950/70">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-2xl font-black text-white">SkillSwap</p>
            <p className="mt-2 max-w-sm text-sm text-slate-400">Exchange skills, unlock opportunities, and grow together.</p>
          </div>
          <FooterColumn title="Product" links={["Browse", "Matches", "Sessions", "Analysis"]} />
          <FooterColumn title="Company" links={["About", "Careers", "Partners", "Contact"]} />
          <FooterColumn title="Resources" links={["Help Center", "Community", "Blog", "Guides"]} />
          <FooterColumn title="Legal" links={["Privacy", "Terms", "Cookies", "Security"]} />
        </div>
        <div className="border-t border-slate-800">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} SkillSwap. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {[
                "LinkedIn",
                "X",
                "Instagram",
              ].map((item) => (
                <a key={item} href="#" className="text-slate-400 transition hover:text-amber-300">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">{title}</p>
      <div className="mt-3 space-y-2 text-sm text-slate-400">
        {links.map((link) => (
          <a key={link} href="#" className="block transition hover:text-amber-300">
            {link}
          </a>
        ))}
      </div>
    </div>
  );
}
