"use client";

import React, { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface LandingPageProps {
  onSignIn: (email: string) => void;
}

/* ─── tiny helpers ─────────────────────────────────────────────── */

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ─── Auth card ─────────────────────────────────────────────────── */

function AuthCard({ onSignIn }: { onSignIn: (email: string) => void }) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");
  const [siShowPass, setSiShowPass] = useState(false);
  const [siLoading, setSiLoading] = useState(false);
  const [siError, setSiError] = useState("");

  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suShowPass, setSuShowPass] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);
  const [suLoading, setSuLoading] = useState(false);
  const [suError, setSuError] = useState("");
  const [suSuccess, setSuSuccess] = useState(false);

  const switchTab = (t: "signin" | "signup") => {
    setTab(t);
    setSiError("");
    setSuError("");
    setSuSuccess(false);
  };

  const handleSignIn = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!siEmail.trim() || !siPass) { setSiError("Please fill in all fields."); return; }
    setSiLoading(true);
    setSiError("");
    try {
      const res = await fetch(`${API}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: siEmail.trim(), password: siPass }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        onSignIn(body.user.email);
      } else {
        setSiError(body.detail?.message || body.error || "Invalid email or password.");
      }
    } catch {
      setSiError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setSiLoading(false);
    }
  };

  const handleSignUp = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!suName.trim() || !suEmail.trim() || !suPass || !suConfirm) {
      setSuError("Please fill in all fields."); return;
    }
    if (!suEmail.includes("@")) { setSuError("Enter a valid email address."); return; }
    if (suPass.length < 6) { setSuError("Password must be at least 6 characters."); return; }
    if (suPass !== suConfirm) { setSuError("Passwords don't match."); return; }
    setSuLoading(true);
    setSuError("");
    try {
      const res = await fetch(`${API}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: suName.trim(), email: suEmail.trim(), password: suPass }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        setSuSuccess(true);
        setTimeout(() => {
          setSiEmail(suEmail.trim());
          switchTab("signin");
        }, 1600);
      } else {
        setSuError(body.detail?.message || body.error || "Registration failed.");
      }
    } catch {
      setSuError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setSuLoading(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/60">
      <div className="px-6 py-6">
        {/* Tab pills */}
        <div className="mb-5 flex rounded-lg bg-zinc-100 p-0.5">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
                tab === t
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* ── Sign In form ── */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={siEmail}
                onChange={(e) => { setSiEmail(e.target.value); setSiError(""); }}
                autoFocus
                className={inputCls}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Password</label>
                <button type="button" className="text-[10px] text-indigo-600 hover:text-indigo-700 transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={siShowPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={siPass}
                  onChange={(e) => { setSiPass(e.target.value); setSiError(""); }}
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setSiShowPass((p) => !p)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <EyeIcon open={siShowPass} />
                </button>
              </div>
            </div>

            {siError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {siError}
              </div>
            )}

            <button
              type="submit"
              disabled={siLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
            >
              {siLoading ? <><SpinIcon /> Signing in…</> : "Sign in →"}
            </button>

            <p className="text-center text-[11px] text-zinc-500">
              No account?{" "}
              <button type="button" onClick={() => switchTab("signup")} className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                Create one free
              </button>
            </p>
          </form>
        )}

        {/* ── Sign Up form ── */}
        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-3">
            {suSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-2 ring-emerald-200">
                  <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-zinc-900">Account created!</p>
                  <p className="mt-1 text-xs text-zinc-500">Redirecting you to sign in…</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Full name</label>
                  <input
                    type="text"
                    placeholder="Alex Johnson"
                    value={suName}
                    onChange={(e) => { setSuName(e.target.value); setSuError(""); }}
                    autoFocus
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={suEmail}
                    onChange={(e) => { setSuEmail(e.target.value); setSuError(""); }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Password</label>
                  <div className="relative">
                    <input
                      type={suShowPass ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={suPass}
                      onChange={(e) => { setSuPass(e.target.value); setSuError(""); }}
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setSuShowPass((p) => !p)}
                      className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <EyeIcon open={suShowPass} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Confirm password</label>
                  <div className="relative">
                    <input
                      type={suShowConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={suConfirm}
                      onChange={(e) => { setSuConfirm(e.target.value); setSuError(""); }}
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setSuShowConfirm((p) => !p)}
                      className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <EyeIcon open={suShowConfirm} />
                    </button>
                  </div>
                </div>

                {suError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {suError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={suLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {suLoading ? <><SpinIcon /> Creating account…</> : "Create free account →"}
                </button>

                <p className="text-center text-[11px] text-zinc-500">
                  Have an account?{" "}
                  <button type="button" onClick={() => switchTab("signin")} className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                    Sign in
                  </button>
                </p>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Animated counter ──────────────────────────────────────────── */

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setValue(target); clearInterval(timer); return; }
          setValue(Math.floor(start));
        }, 16);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* ─── Feature card ──────────────────────────────────────────────── */
function FeatureCard({ icon, iconBg, accent, title, desc }: {
  icon: React.ReactNode; iconBg: string; accent: string; title: string; desc: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className={`h-1.5 w-full ${accent}`} />
      <div className="flex flex-1 flex-col p-6">
        <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} shadow-sm`}>
          {icon}
        </div>
        <h3 className="mb-2 text-base font-bold text-zinc-900">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-600">{desc}</p>
      </div>
    </div>
  );
}

/* ─── FAQ accordion ─────────────────────────────────────────────── */
const FAQS = [
  { q: "Do I need a credit card to get started?", a: "No. Creating an account and using all core features is completely free. Just sign up and start learning." },
  { q: "How does the AI classroom generation work?", a: 'After installing the Chrome extension, click "Generate Classroom" on any YouTube tutorial page. The AI (Claude) analyzes the video metadata and transcript, then produces a full course structure — modules, lessons, quizzes, and assignments — in under 30 seconds.' },
  { q: "What is spaced repetition and why does it matter?", a: "Spaced repetition is a scientifically-proven study method that schedules review sessions at increasing intervals based on how well you recall each item. It produces up to 2× better long-term retention compared to traditional re-reading." },
  { q: "Is my data private and secure?", a: "Yes. Your progress and quiz answers are stored in your own account and are never sold or shared. Passwords are hashed with a salted SHA-256 before storage." },
  { q: "Can I use this for any topic — not just coding?", a: "Absolutely. LearnAnythingAI works with any YouTube tutorial — cooking, music, design, math, science, business, language learning, and more. If there's a tutorial for it, there's now a classroom for it." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200 last:border-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-zinc-900 transition-colors hover:text-indigo-600"
      >
        {q}
        <svg
          className={`h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-zinc-600">{a}</p>
      )}
    </div>
  );
}

/* ─── Main landing page ─────────────────────────────────────────── */
export default function LandingPage({ onSignIn }: LandingPageProps) {
  const authRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = () => {
    authRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased">

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-8 py-3.5 lg:px-16">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4 text-white">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <span className="text-base font-extrabold tracking-tight text-zinc-900">
              LearnAnything<span className="text-indigo-600">AI</span>
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-500 sm:flex">
            <a href="#features" className="transition-colors hover:text-zinc-900">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-zinc-900">How it works</a>
            <a href="#faq" className="transition-colors hover:text-zinc-900">FAQ</a>
          </nav>

          <button
            onClick={scrollToAuth}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
          >
            Get started free
          </button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="flex h-screen pt-[64px]">

        {/* ── Left: dark marketing panel ── */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 px-12 py-10 lg:flex lg:w-[58%]">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-violet-600/20 blur-[80px]" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-400/10 blur-[100px]" />
          </div>

          {/* Top: logo */}
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4 text-white">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <span className="text-sm font-extrabold tracking-tight text-white">
              LearnAnything<span className="text-indigo-300">AI</span>
            </span>
          </div>

          {/* Center: headline + copy */}
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-300" />
              </span>
              <span className="text-xs font-medium text-indigo-200">Powered by Claude AI · Free to use</span>
            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
              Turn any YouTube
              <br />
              tutorial into a
              <br />
              <span className="text-indigo-300">real classroom</span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-indigo-200">
              LearnAnythingAI generates a full course — modules, quizzes, coding assignments, and daily spaced-repetition reviews — from any YouTube video in under 30 seconds.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "AI-generated syllabus, quizzes & assignments",
                "SM-2 spaced-repetition review engine",
                "Knowledge mastery profile across all topics",
                "AI learning coach that knows your course",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-indigo-100">
                  <svg className="h-4 w-4 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom: stats */}
          <div className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[
              { n: "30s", label: "Avg. course generation" },
              { n: "6+", label: "Learning activity types" },
              { n: "2×", label: "Better recall via SR" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white">{s.n}</p>
                <p className="mt-0.5 text-[11px] text-indigo-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: auth panel ── */}
        <div
          ref={authRef}
          className="flex flex-1 flex-col items-center justify-center bg-white px-8 py-10"
        >
          <div className="w-full max-w-sm">
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome</h2>
              <p className="mt-1 text-sm text-zinc-500">Sign in to your account or create a free one.</p>
            </div>
            <AuthCard onSignIn={onSignIn} />
          </div>
        </div>

      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────── */}
      <section className="border-y border-zinc-200 bg-zinc-50 px-8 py-12 lg:px-16">
        <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
          {[
            { target: 30, suffix: "s", label: "Avg. classroom generation" },
            { target: 6, suffix: "+", label: "Learning activity types" },
            { target: 100, suffix: "%", label: "Retention-focused design" },
            { target: 2, suffix: "×", label: "Better recall with spaced repetition" },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-4xl font-extrabold tabular-nums text-indigo-600">
                <AnimatedNumber target={s.target} suffix={s.suffix} />
              </p>
              <p className="mt-1.5 text-xs font-medium text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXTENSION DOWNLOAD ─────────────────────────────────────── */}
      <section className="border-b border-zinc-200 bg-white px-8 py-16 lg:px-16">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: copy */}
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1">
              <svg className="h-3.5 w-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-violet-700">Chrome Extension</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              Works right inside YouTube
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Install the browser extension, open any YouTube tutorial, click <strong className="text-zinc-700">"Generate Classroom"</strong> — and your full AI course is ready in 30 seconds without leaving the tab.
            </p>
            <ol className="mt-5 space-y-2 text-sm text-zinc-600">
              {[
                "Download and unzip the extension file",
                "Open Chrome → go to chrome://extensions",
                'Enable "Developer mode" (top right toggle)',
                'Click "Load unpacked" → select the unzipped folder',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Right: download card */}
          <div className="w-full max-w-xs flex-shrink-0">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-900">LearnAnythingAI Extension</p>
              <p className="mt-1 text-xs text-zinc-500">v1.1.0 · Chrome · Free</p>
              <a
                href="/learnanythingai-extension.zip"
                download="learnanythingai-extension.zip"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Extension
              </a>
              <p className="mt-3 text-[10px] text-zinc-400">Requires Chrome · Manual install until Web Store listing is live</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section id="features" className="bg-zinc-50 px-8 py-24 lg:px-16">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Everything in one place</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Built for serious learners
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
            Not just a video library. A complete learning system with every tool that research says actually produces retention.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>,
              iconBg: "bg-violet-600", accent: "bg-violet-500",
              title: "AI Classroom from YouTube",
              desc: "Paste any YouTube tutorial URL. Get a fully structured course — modules, lessons, objectives, tags, and difficulty — generated in under 30 seconds.",
            },
            {
              icon: <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
              iconBg: "bg-indigo-600", accent: "bg-indigo-500",
              title: "Quizzes & Coding Assignments",
              desc: "Every module ships with auto-generated MCQ quizzes and hands-on coding assignments with automated test-case grading.",
            },
            {
              icon: <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              iconBg: "bg-emerald-600", accent: "bg-emerald-500",
              title: "Spaced-Repetition Reviews",
              desc: "The SM-2 algorithm schedules daily reviews for every question you've answered. Harder items come back sooner. Retention compounds over time.",
            },
            {
              icon: <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
              iconBg: "bg-amber-500", accent: "bg-amber-400",
              title: "Knowledge Intelligence Profile",
              desc: "Every concept across all your videos is tracked. See mastery scores, identify weak spots, and get video recommendations targeting exactly your gaps.",
            },
            {
              icon: <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
              iconBg: "bg-rose-500", accent: "bg-rose-400",
              title: "AI Learning Coach Chat",
              desc: "Stuck mid-video? Ask your AI tutor. It knows exactly which course you're on and delivers context-aware explanations right inside the player.",
            },
            {
              icon: <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
              iconBg: "bg-cyan-600", accent: "bg-cyan-500",
              title: "Progress Analytics",
              desc: "Track review streaks, weekly activity charts, mastery distribution radars, and an AI coach that tells you your exact next step.",
            },
          ].map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* ── DEEP FEATURE SHOWCASE ──────────────────────────────────── */}
      <section className="border-t border-zinc-200 px-8 py-20 lg:px-16">
        <div className="grid items-center gap-16 lg:grid-cols-2 mb-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Instant course generation</p>
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              From YouTube link to full course in 30 seconds
            </h3>
            <p className="mt-4 text-zinc-500 leading-relaxed">
              Install the browser extension, open any YouTube tutorial, and click one button. Claude analyzes the video and produces a structured syllabus complete with module descriptions, per-lesson timestamps, difficulty tags, learning objectives, and auto-generated quizzes — all without you lifting a finger.
            </p>
            <ul className="mt-6 space-y-3">
              {["Module-by-module breakdown", "Per-lesson video timestamps", "Difficulty & skill tags", "Auto-generated quizzes per module"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-zinc-700">
                  <CheckIcon />{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="flex-1 mx-3 h-6 rounded-lg bg-zinc-100 flex items-center px-3 text-[10px] text-zinc-400 font-mono">
                youtube.com/watch?v=dQw4w9WgXcQ
              </div>
            </div>
            <div className="space-y-2">
              {["Introduction & Setup", "Core Concepts", "Practical Examples", "Advanced Patterns", "Project Walkthrough"].map((mod, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div className={`h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i < 2 ? "bg-indigo-50 text-indigo-600" : "bg-zinc-100 text-zinc-400"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 truncate">{mod}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{3 + i} lessons · Quiz</p>
                  </div>
                  {i < 2 && (
                    <div className="h-1.5 w-16 rounded-full bg-zinc-200">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: i === 0 ? "100%" : "60%" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="order-2 lg:order-1 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Daily Review Queue</p>
            <div className="space-y-3">
              {[
                { q: "What is the time complexity of binary search?", tag: "Algorithms", due: "Due now", color: "text-rose-600 bg-rose-50" },
                { q: "Explain the difference between let and const in JS", tag: "JavaScript", due: "Due now", color: "text-rose-600 bg-rose-50" },
                { q: "What does the useEffect cleanup function do?", tag: "React", due: "In 2 days", color: "text-amber-600 bg-amber-50" },
                { q: "How does CSS grid auto-placement work?", tag: "CSS", due: "In 5 days", color: "text-emerald-600 bg-emerald-50" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div className="mt-0.5 flex-1 min-w-0">
                    <p className="text-xs text-zinc-700 leading-snug line-clamp-1">{item.q}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-zinc-500 bg-zinc-100 rounded-full px-2 py-0.5">{item.tag}</span>
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${item.color}`}>{item.due}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3">
              <div className="text-2xl font-extrabold text-indigo-600">🔥 12</div>
              <div>
                <p className="text-xs font-bold text-zinc-900">Day streak</p>
                <p className="text-[10px] text-zinc-500">Keep reviewing daily to maintain it</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Spaced repetition</p>
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              Review smarter. Remember longer.
            </h3>
            <p className="mt-4 text-zinc-500 leading-relaxed">
              Every quiz question you answer gets scheduled using the SM-2 spaced-repetition algorithm — the same method used by Anki, the world's most effective flashcard app. Items you get wrong come back the next day. Items you nail get spaced out by weeks, then months.
            </p>
            <ul className="mt-6 space-y-3">
              {["Questions scheduled by SM-2 algorithm", "Daily review deck auto-populated", "Streak tracking for daily motivation", "Per-concept mastery scores"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-zinc-700">
                  <CheckIcon />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-zinc-200 bg-zinc-50 px-8 py-24 lg:px-16">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Simple setup</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">Up and learning in 4 steps</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", icon: "🧩", title: "Install extension", desc: "Add the LearnAnythingAI Chrome extension from the web store. One click, no config." },
            { n: "02", icon: "▶️", title: "Open any tutorial", desc: "Navigate to any YouTube tutorial — coding, design, cooking, music, math, anything." },
            { n: "03", icon: "⚡", title: "Generate classroom", desc: 'Click "Generate Classroom" in the extension panel. AI builds your course in ~30 seconds.' },
            { n: "04", icon: "🎯", title: "Learn & review daily", desc: "Watch with your syllabus, take quizzes, get assignments, and do daily spaced reviews." },
          ].map((step, i) => (
            <div key={i} className="relative rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <div className="absolute right-4 top-4 text-xs font-bold text-zinc-300">{step.n}</div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2">{step.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section className="border-t border-zinc-200 px-8 py-24 lg:px-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Learner stories</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900">What learners are saying</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Riya M.", role: "CS Student", text: "I went from passively rewatching tutorials to actually retaining concepts. The daily review is a game changer — I feel like I finally have a system.", avatar: "R", color: "bg-violet-500" },
            { name: "James K.", role: "Self-taught Developer", text: "The quiz generation alone saves me hours. Before this I had to manually write flashcards. Now every video I watch becomes a full study deck automatically.", avatar: "J", color: "bg-indigo-500" },
            { name: "Priya S.", role: "Data Science Learner", text: "The knowledge profile shows me exactly which concepts I'm weak on. I stopped watching random tutorials and started watching videos that target my gaps.", avatar: "P", color: "bg-fuchsia-500" },
            { name: "Carlos D.", role: "UX Designer", text: "I use it for design tutorials. Even non-coding courses get great quizzes. The AI understands the actual content — not just the title.", avatar: "C", color: "bg-emerald-600" },
            { name: "Arjun T.", role: "Backend Engineer", text: "The spaced repetition scheduler is exactly like Anki but built right into my learning workflow. I don't have to export anything — it just works.", avatar: "A", color: "bg-amber-600" },
            { name: "Sarah L.", role: "High School Teacher", text: "I recommend this to my students for any YouTube tutorial they're using. It turns passive video watching into structured, assessable learning.", avatar: "S", color: "bg-rose-500" },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-9 w-9 flex-shrink-0 rounded-full ${t.color} flex items-center justify-center text-sm font-bold text-white`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(5)].map((_, si) => (
                    <svg key={si} className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-zinc-200 bg-zinc-50 px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Got questions?</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900">Frequently asked</h2>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 shadow-sm">
            {FAQS.map((f, i) => (
              <FaqItem key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-zinc-200 bg-gradient-to-br from-indigo-50 to-white px-8 py-24 text-center lg:px-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Ready to learn{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            anything
          </span>
          ?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-zinc-500">
          Join learners who have turned passive video watching into structured, retention-focused learning. Free to use. No credit card.
        </p>
        <button
          onClick={scrollToAuth}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
        >
          Create free account
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 bg-white px-8 py-10 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5 text-white">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <span className="text-sm font-bold text-zinc-900">
              LearnAnything<span className="text-indigo-600">AI</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400">Transform any YouTube tutorial into a structured AI-powered classroom.</p>
          <p className="text-xs text-zinc-400">© {new Date().getFullYear()} LearnAnythingAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
