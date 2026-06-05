"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";

// ─── Palette ───────────────────────────────────────────────
const c = {
  bg: "#F5F7F3",
  text: "#1F352B",
  textMuted: "#4A6355",
  accent: "#6BA6D9",
  cta: "#C97C5D",
  ctaHover: "#B56A4D",
  soft: "#DDE8D5",
  softAlt: "#E8EDE4",
  card: "#FFFFFF",
  border: "#D0D9CA",
};

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// ─── Reusable animation variants ───────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

// ─── Section wrapper with scroll reveal ────────────────────
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={delay}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Mock gallery hero visual ──────────────────────────────
function HeroGalleryMock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      mouseX.set(x * 12);
      mouseY.set(y * 8);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  const photos = [
    { color: "#8DB580", icon: "mountain", label: "Summit view" },
    { color: "#6BA6D9", icon: "wave", label: "Beach sunset" },
    { color: "#C97C5D", icon: "tent", label: "Camp night" },
    { color: "#D4A97A", icon: "road", label: "Road trip" },
    { color: "#7BAFAF", icon: "tree", label: "Forest trail" },
    { color: "#B8957A", icon: "city", label: "City walk" },
  ];

  const avatars = [
    { color: "#C97C5D", initial: "S" },
    { color: "#6BA6D9", initial: "E" },
    { color: "#8DB580", initial: "M" },
  ];

  const IconSvg = ({ type }: { type: string }) => {
    switch (type) {
      case "mountain":
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 26L14 8L20 18L24 14L28 26H4Z" fill="white" fillOpacity="0.4" />
            <path d="M4 26L14 8L20 18" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" />
            <path d="M20 18L24 14L28 26" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" />
          </svg>
        );
      case "wave":
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="22" cy="10" r="4" fill="white" fillOpacity="0.4" />
            <path d="M4 20C8 16 12 24 16 20C20 16 24 24 28 20" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" />
            <path d="M4 24C8 20 12 28 16 24C20 20 24 28 28 24" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
          </svg>
        );
      case "tent":
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 6L6 26H26L16 6Z" fill="white" fillOpacity="0.3" />
            <path d="M16 6L6 26H26L16 6Z" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" />
            <path d="M13 26L16 18L19 26" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
          </svg>
        );
      case "road":
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M10 28L14 4H18L22 28" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
            <path d="M16 8V12M16 16V20M16 24V28" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="2 4" />
          </svg>
        );
      case "tree":
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L8 16H12L7 26H25L20 16H24L16 4Z" fill="white" fillOpacity="0.3" />
            <rect x="14" y="24" width="4" height="4" fill="white" fillOpacity="0.4" />
          </svg>
        );
      case "city":
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="14" width="8" height="14" rx="1" fill="white" fillOpacity="0.3" />
            <rect x="14" y="8" width="6" height="20" rx="1" fill="white" fillOpacity="0.35" />
            <rect x="22" y="12" width="6" height="16" rx="1" fill="white" fillOpacity="0.3" />
            <rect x="6" y="17" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" />
            <rect x="6" y="22" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" />
            <rect x="16" y="11" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" />
            <rect x="16" y="16" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  const rotateX = useTransform(springY, [-8, 8], [2, -2]);
  const rotateY = useTransform(springX, [-12, 12], [-3, 3]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full max-w-[560px] mx-auto"
      style={{ perspective: 800 }}
    >
      {/* Browser frame */}
      <motion.div
        style={{ x: springX, y: springY, rotateX, rotateY }}
        className="relative rounded-2xl overflow-hidden shadow-xl"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ background: c.card, borderBottom: `1px solid ${c.border}` }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#FF605C" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#FFBD44" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#00CA4E" }} />
          </div>
          <div
            className="flex-1 text-center text-xs font-medium rounded-md py-1 mx-8"
            style={{ background: c.softAlt, color: c.textMuted }}
          >
            stillroom.app
          </div>
        </div>

        {/* App content */}
        <div className="p-5 pb-6" style={{ background: c.bg }}>
          {/* Album header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold" style={{ color: c.text }}>
                Japan Road Trip
              </h4>
              <p className="text-xs mt-0.5" style={{ color: c.textMuted }}>
                48 photos &middot; 5 contributors
              </p>
            </div>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {avatars.map((a, i) => (
                  <motion.div
                    key={i}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                    style={{ background: a.color, borderColor: c.bg, zIndex: 3 - i }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    {a.initial}
                  </motion.div>
                ))}
              </div>
              <motion.span
                className="text-xs font-medium ml-2"
                style={{ color: c.textMuted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                +4
              </motion.span>
            </div>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <motion.div
                key={i}
                className="aspect-[4/3] rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{ background: photo.color }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <IconSvg type={photo.icon} />
                <span className="absolute bottom-1 left-1.5 text-[9px] font-medium text-white/70">
                  {photo.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating toast notification */}
      <motion.div
        className="absolute -right-4 top-24 md:-right-16 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 z-10"
        style={{ background: c.card, border: `1px solid ${c.border}` }}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: "#6BA6D9" }}
        >
          E
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: c.text }}>Emma added 12 photos</p>
          <p className="text-[10px]" style={{ color: c.textMuted }}>Just now</p>
        </div>
      </motion.div>

      {/* Floating album badge */}
      <motion.div
        className="absolute -left-4 bottom-16 md:-left-12 rounded-xl px-4 py-2.5 shadow-lg z-10"
        style={{ background: c.card, border: `1px solid ${c.border}` }}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
      >
        <p className="text-[10px] font-medium" style={{ color: c.textMuted }}>Shared album</p>
        <p className="text-xs font-bold" style={{ color: c.text }}>Mountain Escape</p>
        <div className="flex -space-x-1.5 mt-1.5">
          {["#C97C5D", "#8DB580", "#6BA6D9"].map((col, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border-2"
              style={{ background: col, borderColor: c.card, zIndex: 3 - i }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Animated counter ──────────────────────────────────────
function Counter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const num = parseInt(target.replace(/\D/g, ""));
          const duration = 1200;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(num * eased);
            setDisplay(current.toLocaleString());
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const steps = [
    {
      num: "01",
      title: "Create a shared album",
      desc: "Start a new album for your trip, event, or adventure. Give it a name and you\u2019re ready.",
    },
    {
      num: "02",
      title: "Invite your group",
      desc: "Share the link with friends, family, or fellow travellers. No accounts needed to view.",
    },
    {
      num: "03",
      title: "Everyone uploads",
      desc: "The whole group adds their photos to one place. Every angle, every moment, all together.",
    },
  ];

  const features = [
    {
      title: "Group uploads",
      desc: "Everyone in the group can upload their own photos to the same shared album.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="10" cy="8" r="4" stroke={c.cta} strokeWidth="1.5" />
          <circle cx="18" cy="8" r="4" stroke={c.cta} strokeWidth="1.5" />
          <path d="M4 22c0-4 4-6 8-6h4c4 0 8 2 8 6" stroke={c.cta} strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: "Share with anyone",
      desc: "Send a link to view or contribute. Works on any device, no sign-up required to view.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M10 14h8M18 14l-3-3M18 14l-3 3" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" />
          <rect x="3" y="6" width="22" height="16" rx="3" stroke={c.accent} strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: "Download & collect",
      desc: "Download individual photos or the entire album. Keep the memories that matter most.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 4v14M14 18l-4-4M14 18l4-4" stroke={c.cta} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M4 20v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke={c.cta} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Privacy controls",
      desc: "Choose who can view, upload, or download. Keep your shared memories secure and private.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="6" y="12" width="16" height="12" rx="2" stroke={c.accent} strokeWidth="1.5" />
          <path d="M10 12V8a4 4 0 118 0v4" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="14" cy="18" r="1.5" fill={c.accent} />
        </svg>
      ),
    },
  ];

  const useCases = [
    "Road trips",
    "Hiking & camping",
    "Weddings & events",
    "City breaks",
    "Family reunions",
    "Festival weekends",
  ];

  return (
    <div className="min-h-screen" style={{ background: c.bg, color: c.text }}>
      {/* ── Nav ─────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 w-full z-50 backdrop-blur-md"
        style={{ background: `${c.bg}E6`, borderBottom: `1px solid ${c.border}` }}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
            style={{ color: c.text }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" stroke={c.text} strokeWidth="1.5" />
              <circle cx="9" cy="9" r="2" stroke={c.text} strokeWidth="1.5" />
              <path
                d="M2 16l5-4 4 3 3-2 8 6"
                stroke={c.text}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Stillroom
          </Link>

          <div
            className="hidden md:flex items-center gap-8 text-sm font-medium"
            style={{ color: c.textMuted }}
          >
            <a href="#how-it-works" className="hover:opacity-70 transition-opacity">
              How it works
            </a>
            <a href="#features" className="hover:opacity-70 transition-opacity">
              Features
            </a>
          </div>

          <div className="flex items-center gap-3">
            <SignedIn>
              <Link href="/dashboard/galleries">
                <button
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ background: c.cta }}
                  onMouseOver={(e) => (e.currentTarget.style.background = c.ctaHover)}
                  onMouseOut={(e) => (e.currentTarget.style.background = c.cta)}
                >
                  My Galleries
                </button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="px-4 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: c.text }}
                >
                  Log in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ background: c.cta }}
                  onMouseOver={(e) => (e.currentTarget.style.background = c.ctaHover)}
                  onMouseOut={(e) => (e.currentTarget.style.background = c.cta)}
                >
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-28 pb-12 md:pt-40 md:pb-20 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-center">
              {/* Left: copy */}
              <div className="max-w-lg">
                <motion.div
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium mb-6"
                  style={{ background: c.soft, color: c.textMuted }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ background: c.cta }} />
                  Free to use &middot; No account needed to view
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-5"
                  style={{ color: c.text }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Collect every photo from the adventure.
                </motion.h1>

                <motion.p
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: c.textMuted }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.6 }}
                >
                  One shared album for your whole group. No more chasing friends for photos
                  after the trip &mdash; everyone uploads to the same place.
                </motion.p>

                <motion.div
                  className="flex flex-wrap gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <button
                        className="px-7 py-3.5 rounded-full text-base font-semibold text-white transition-colors shadow-md"
                        style={{ background: c.cta }}
                        onMouseOver={(e) => (e.currentTarget.style.background = c.ctaHover)}
                        onMouseOut={(e) => (e.currentTarget.style.background = c.cta)}
                      >
                        Start a shared album
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard/galleries">
                      <button
                        className="px-7 py-3.5 rounded-full text-base font-semibold text-white transition-colors shadow-md"
                        style={{ background: c.cta }}
                        onMouseOver={(e) => (e.currentTarget.style.background = c.ctaHover)}
                        onMouseOut={(e) => (e.currentTarget.style.background = c.cta)}
                      >
                        Go to Galleries
                      </button>
                    </Link>
                  </SignedIn>
                  <a href="#how-it-works">
                    <button
                      className="px-7 py-3.5 rounded-full text-base font-medium transition-colors"
                      style={{ color: c.text, background: c.softAlt }}
                    >
                      See how it works
                    </button>
                  </a>
                </motion.div>
              </div>

              {/* Right: mock gallery */}
              <div className="relative">
                <HeroGalleryMock />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Trust strip ─────────────────────────────────── */}
      <section
        className="py-12 border-y"
        style={{ borderColor: c.border, background: c.softAlt }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="flex flex-wrap justify-center gap-8 md:gap-16 text-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { value: "12000", suffix: "+", label: "Photos shared" },
              { value: "800", suffix: "+", label: "Group albums" },
              { value: "3000", suffix: "+", label: "Adventures captured" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={staggerItem}>
                <p className="text-2xl md:text-3xl font-bold" style={{ color: c.text }}>
                  <Counter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm mt-1" style={{ color: c.textMuted }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: c.cta }}
            >
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-16" style={{ color: c.text }}>
              Three steps. Every photo. One place.
            </h2>
          </Reveal>

          <motion.div
            className="grid md:grid-cols-3 gap-8 relative"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Connector line (desktop) */}
            <div
              className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-[2px]"
              style={{ background: c.border }}
            />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="relative text-center md:text-left"
                variants={staggerItem}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-5 mx-auto md:mx-0 relative z-10"
                  style={{ background: c.soft, color: c.text }}
                >
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: c.text }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28" style={{ background: c.softAlt }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: c.accent }}
            >
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-14" style={{ color: c.text }}>
              Everything your group needs
            </h2>
          </Reveal>

          <motion.div
            className="grid md:grid-cols-2 gap-5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="rounded-2xl p-6 transition-shadow hover:shadow-md"
                style={{ background: c.card, border: `1px solid ${c.border}` }}
                variants={staggerItem}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: c.soft }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: c.text }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Use cases ───────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: c.cta }}
            >
              Perfect for
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ color: c.text }}>
              Any adventure, any group
            </h2>
          </Reveal>

          <motion.div
            className="flex flex-wrap justify-center gap-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {useCases.map((uc) => (
              <motion.span
                key={uc}
                className="px-5 py-2.5 rounded-full text-sm font-medium"
                style={{ background: c.soft, color: c.text }}
                variants={staggerItem}
                whileHover={{ scale: 1.05 }}
              >
                {uc}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="py-24 md:py-32" style={{ background: c.text }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: c.bg }}>
              Stop chasing friends for photos.
            </h2>
            <p className="text-lg mb-10" style={{ color: `${c.bg}99` }}>
              Create a shared album and let everyone contribute. It takes seconds.
            </p>

            <div className="flex flex-col items-center gap-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button
                    className="px-8 py-4 rounded-full text-base font-semibold transition-colors shadow-lg"
                    style={{ background: c.cta, color: "#fff" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = c.ctaHover)}
                    onMouseOut={(e) => (e.currentTarget.style.background = c.cta)}
                  >
                    Get Started Free
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard/galleries">
                  <button
                    className="px-8 py-4 rounded-full text-base font-semibold transition-colors shadow-lg"
                    style={{ background: c.cta, color: "#fff" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = c.ctaHover)}
                    onMouseOut={(e) => (e.currentTarget.style.background = c.cta)}
                  >
                    Go to Galleries
                  </button>
                </Link>
              </SignedIn>
              <p className="text-xs" style={{ color: `${c.bg}66` }}>
                Free to use &middot; No credit card required
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer
        className="py-8 text-center text-sm"
        style={{ borderTop: `1px solid ${c.border}`, color: c.textMuted }}
      >
        <p>&copy; {new Date().getFullYear()} Stillroom. All rights reserved.</p>
      </footer>
    </div>
  );
}
