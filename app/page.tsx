"use client";

import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Playfair_Display } from "next/font/google";

export const dynamic = "force-dynamic";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

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

// ─── Scroll reveal ─────────────────────────────────────────
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Parallax image ────────────────────────────────────────
function ParallaxImage({
  src,
  alt,
  className = "",
  speed = 0.12,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
  sizes?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`-${speed * 100}%`, `${speed * 100}%`]
  );

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div className="relative w-full h-[115%]" style={{ y }}>
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />
      </motion.div>
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 w-full z-50 transition-all duration-500"
      style={{
        background: scrolled ? `${c.bg}F0` : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? `1px solid ${c.border}`
          : "1px solid transparent",
      }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/stillroom-logo.jpeg"
            alt="stillRoom"
            className="w-7 h-7 rounded-sm object-cover"
          />
          <span
            className="font-bold text-lg tracking-tight transition-colors duration-500"
            style={{ color: scrolled ? c.text : "#fff" }}
          >
            stillRoom
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <SignedIn>
            <Link href="/dashboard/albums">
              <button
                className="px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90"
                style={{ background: c.cta, borderRadius: 6 }}
              >
                My Albums
              </button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="px-4 py-2.5 text-sm font-medium transition-colors duration-500"
                style={{ color: scrolled ? c.text : "#fff" }}
              >
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90"
                style={{ background: c.cta, borderRadius: 6 }}
              >
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Main page ─────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOverlay = useTransform(scrollYProgress, [0, 1], [0.3, 0.65]);

  return (
    <div className={`min-h-screen ${serif.variable}`} style={{ background: c.bg, color: c.text }}>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <Image
            src="/images/adventure.jpg"
            alt="Adventure begins"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          style={{
            background: useTransform(
              heroOverlay,
              (v) => `rgba(31,53,43,${v})`
            ),
          }}
        />

        <motion.div
          className="relative z-10 h-full flex flex-col justify-end pb-16 md:pb-24 px-6 md:px-10 max-w-7xl mx-auto"
          style={{ y: heroTextY }}
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-white mb-5 max-w-3xl italic"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            Your group&rsquo;s memories,
            <br />
            all in one place.
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-white/60 max-w-md mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            One shared album for the whole trip. Everyone uploads,
            everyone sees everything.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <SignedOut>
              <SignUpButton mode="modal">
                <button
                  className="px-7 py-3.5 text-sm font-semibold text-white tracking-wide uppercase transition-all duration-300 hover:opacity-90"
                  style={{ background: c.cta, borderRadius: 4 }}
                >
                  Start a shared album
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard/albums">
                <button
                  className="px-7 py-3.5 text-sm font-semibold text-white tracking-wide uppercase transition-all duration-300 hover:opacity-90"
                  style={{ background: c.cta, borderRadius: 4 }}
                >
                  Go to Albums
                </button>
              </Link>
            </SignedIn>
          </motion.div>
        </motion.div>

        {/* Scroll line */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="w-px h-10 bg-white/40"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ── Story section (Image 1 style) ────────────────── */}
      <section className="py-24 md:py-40 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Large serif heading */}
          <Reveal>
            <h2
              className="text-center text-3xl md:text-5xl lg:text-6xl font-medium mb-4 italic"
              style={{ fontFamily: "var(--font-serif)", color: c.text }}
            >
              After sharing thousands of moments
            </h2>
            <p
              className="text-center text-sm md:text-base mb-24 md:mb-32"
              style={{ color: c.textMuted }}
            >
              we know what really matters
            </p>
          </Reveal>

          {/* Asymmetric text + tall image */}
          <div className="grid md:grid-cols-12 gap-8 md:gap-6 items-start">
            {/* Left: editorial text */}
            <div className="md:col-span-5 md:pt-8">
              <Reveal>
                <p
                  className="text-base md:text-lg leading-[1.8] mb-6"
                  style={{ color: c.text }}
                >
                  stillRoom is a shared photo platform built for the moments
                  that matter most. The trips, the reunions, the celebrations,
                  the adventures you take together.
                </p>
              </Reveal>

              <Reveal delay={0.08}>
                <p
                  className="text-base md:text-lg leading-[1.8] mb-6"
                  style={{ color: c.text }}
                >
                  So many groups come back from a trip with photos scattered
                  across ten different phones. Everyone promises to share,
                  but it never quite happens...
                </p>
              </Reveal>

              <Reveal delay={0.16}>
                <p
                  className="text-lg md:text-xl leading-[1.7] font-bold mb-8"
                  style={{ color: c.text }}
                >
                  They don&rsquo;t want another group chat full of
                  compressed images. They want one beautiful place where
                  everyone&rsquo;s photos live together.
                </p>
              </Reveal>

              <Reveal delay={0.24}>
                <p
                  className="text-base leading-[1.8] mb-2"
                  style={{ color: c.textMuted }}
                >
                  From road trips across red deserts
                </p>
                <p
                  className="text-base leading-[1.8] mb-2"
                  style={{ color: c.textMuted }}
                >
                  to backyard birthday parties.
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <p
                  className="text-base leading-[1.8] mb-2"
                  style={{ color: c.textMuted }}
                >
                  From family holidays in new cities
                </p>
                <p
                  className="text-base leading-[1.8] mb-6"
                  style={{ color: c.textMuted }}
                >
                  to two friends hiking with no plan at all.
                </p>
              </Reveal>

              <Reveal delay={0.36}>
                <p
                  className="text-base leading-[1.8] mb-6"
                  style={{ color: c.text }}
                >
                  We&rsquo;ve seen every kind of shared memory.
                </p>
                <p
                  className="text-base leading-[1.8] mb-1"
                  style={{ color: c.text }}
                >
                  A shared album isn&rsquo;t just a gallery.
                </p>
                <p
                  className="text-base leading-[1.8] mb-1"
                  style={{ color: c.text }}
                >
                  It&rsquo;s a way of saying: this mattered.
                </p>
                <p
                  className="text-base leading-[1.8]"
                  style={{ color: c.text }}
                >
                  We were here, together.
                </p>
              </Reveal>
            </div>

            {/* Right: tall image, offset down */}
            <div className="md:col-span-6 md:col-start-7">
              <Reveal delay={0.1}>
                <ParallaxImage
                  src="/images/family2.jpg"
                  alt="Family in flower field"
                  className="aspect-[3/4] md:aspect-[2/3] rounded-sm relative"
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quote section (Image 2 style) ────────────────── */}
      <section className="py-12 md:py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-6 md:gap-5">
          {/* Left: large image, full height */}
          <div className="md:col-span-7">
            <Reveal>
              <ParallaxImage
                src="/images/friends.jpg"
                alt="Friends sharing a moment"
                className="aspect-[3/4] md:aspect-auto md:h-[85vh] rounded-sm relative"
                sizes="(max-width: 768px) 100vw, 58vw"
              />
            </Reveal>
          </div>

          {/* Right: label + quote + smaller image */}
          <div className="md:col-span-5 flex flex-col justify-center gap-8 md:gap-10 md:pl-6">
            <Reveal delay={0.15}>
              <p
                className="text-xs font-medium uppercase tracking-[0.3em]"
                style={{ color: c.textMuted }}
              >
                Real Moments
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div>
                <p
                  className="text-2xl md:text-3xl lg:text-4xl leading-[1.3] font-normal mb-1"
                  style={{ fontFamily: "var(--font-serif)", color: c.text }}
                >
                  Unscripted.
                </p>
                <p
                  className="text-2xl md:text-3xl lg:text-4xl leading-[1.3] font-normal mb-1"
                  style={{ fontFamily: "var(--font-serif)", color: c.text }}
                >
                  Unposed.
                </p>
                <p
                  className="text-2xl md:text-3xl lg:text-4xl leading-[1.3] font-normal"
                  style={{ fontFamily: "var(--font-serif)", color: c.text }}
                >
                  Exactly how it felt.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.35}>
              <ParallaxImage
                src="/images/exploring.jpg"
                alt="Exploring the outdoors"
                className="aspect-[4/3] rounded-sm relative"
                speed={0.08}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Staggered gallery ────────────────────────────── */}
      <section className="py-20 md:py-32 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <p
              className="text-xs font-medium uppercase tracking-[0.3em] mb-6"
              style={{ color: c.cta }}
            >
              The Gallery
            </p>
          </Reveal>

          <div className="grid md:grid-cols-12 gap-4 md:gap-5">
            {/* Large left */}
            <div className="md:col-span-7">
              <Reveal>
                <ParallaxImage
                  src="/images/graduation.jpg"
                  alt="Graduation celebration"
                  className="aspect-[16/10] rounded-sm relative"
                  sizes="(max-width: 768px) 100vw, 58vw"
                />
              </Reveal>
            </div>

            {/* Small right, pushed down */}
            <div className="md:col-span-5 md:mt-24">
              <Reveal delay={0.15}>
                <ParallaxImage
                  src="/images/family.jpg"
                  alt="Family walking together"
                  className="aspect-[4/5] rounded-sm relative"
                  speed={0.08}
                />
              </Reveal>
            </div>

            {/* Wide bottom, offset left */}
            <div className="md:col-span-5 md:col-start-2 md:-mt-16">
              <Reveal delay={0.1}>
                <ParallaxImage
                  src="/images/travel.jpg"
                  alt="Travel sunset"
                  className="aspect-[3/2] rounded-sm relative"
                  speed={0.1}
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Editorial statement ──────────────────────────── */}
      <section className="py-20 md:py-32 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2
              className="text-3xl md:text-5xl lg:text-[3.5rem] font-medium leading-[1.2] italic"
              style={{ fontFamily: "var(--font-serif)", color: c.text }}
            >
              No more chasing friends for photos.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p
              className="text-base md:text-lg leading-relaxed mt-8 max-w-xl"
              style={{ color: c.textMuted }}
            >
              Create a shared album, send the link, and let everyone add
              their shots. Every angle, every candid, every golden hour moment
              &mdash; together in one place.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section
        className="py-20 md:py-32 px-6 md:px-10"
        style={{ background: c.softAlt }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-12 md:gap-8">
          {/* Left heading */}
          <div className="md:col-span-4">
            <Reveal>
              <p
                className="text-xs font-medium uppercase tracking-[0.3em] mb-4"
                style={{ color: c.cta }}
              >
                How it works
              </p>
              <h2
                className="text-2xl md:text-3xl font-medium italic"
                style={{ fontFamily: "var(--font-serif)", color: c.text }}
              >
                Simple as
                <br />
                it should be.
              </h2>
            </Reveal>
          </div>

          {/* Right steps */}
          <div className="md:col-span-7 md:col-start-6 space-y-12">
            {[
              {
                num: "01",
                title: "Create an album",
                desc: "Name it after your trip, event, or adventure. It takes five seconds.",
              },
              {
                num: "02",
                title: "Share the link",
                desc: "Send it to your group. They can view and upload from any device, no account needed.",
              },
              {
                num: "03",
                title: "Relive it together",
                desc: "Everyone\u2019s photos, one album. Download favourites or the entire collection.",
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="flex gap-6 items-start">
                  <span
                    className="text-sm font-medium shrink-0 mt-1"
                    style={{ color: c.border }}
                  >
                    {step.num}
                  </span>
                  <div>
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{ color: c.text }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-base leading-relaxed"
                      style={{ color: c.textMuted }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/travel.jpg"
            alt="The journey"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: "rgba(31,53,43,0.55)" }}
          />
        </div>

        <Reveal className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-medium text-white leading-tight mb-6 italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Start collecting
            <br />
            your memories.
          </h2>
          <p className="text-base md:text-lg text-white/50 mb-10 max-w-lg mx-auto leading-relaxed">
            Your next adventure is around the corner. Make sure
            everyone&rsquo;s photos end up in the same place.
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <button
                className="px-8 py-4 text-sm font-semibold text-white uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                style={{ background: c.cta, borderRadius: 4 }}
              >
                Get Started Free
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard/albums">
              <button
                className="px-8 py-4 text-sm font-semibold text-white uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                style={{ background: c.cta, borderRadius: 4 }}
              >
                Go to Albums
              </button>
            </Link>
          </SignedIn>
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer
        className="py-10 px-6 md:px-10"
        style={{ borderTop: `1px solid ${c.border}` }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/stillroom-logo.jpeg"
              alt="stillRoom"
              className="w-6 h-6 rounded-sm object-cover"
            />
            <span className="font-bold text-sm" style={{ color: c.text }}>
              stillRoom
            </span>
          </div>
          <p className="text-sm" style={{ color: c.textMuted }}>
            &copy; {new Date().getFullYear()} stillRoom. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
