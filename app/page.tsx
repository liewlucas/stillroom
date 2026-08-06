"use client";

import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import { Playfair_Display, Caveat } from "next/font/google";
import {
  ArrowDown,
  Check,
  ChevronRight,
  FileImage,
  Heart,
  Home,
  Images,
  MoreHorizontal,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const script = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-script",
  display: "swap",
});

// ─── Palette ───────────────────────────────────────────────
const c = {
  cream: "#F6F1E6", // light panel background
  page: "#FCF8EF", // album page surface
  ink: "#1C1712", // near-black warm text
  panelDark: "#1B1511", // dark panel background
  panelDarker: "#17110C",
  cardDark: "#231B14",
  tan: "#C08552",
  terracotta: "#C97C5D",
  mutedLight: "#7C7060", // muted text on cream
  mutedDark: "#A79A87", // muted text on dark
  line: "#E3D9C7",
  creamText: "#F3EDDF", // light text on dark
};

const PHOTOS = {
  adventure: "/images/adventure.jpg",
  exploring: "/images/exploring.jpg",
  family: "/images/family.jpg",
  family2: "/images/family2.jpg",
  friends: "/images/friends.jpg",
  graduation: "/images/graduation.jpg",
  travel: "/images/travel.jpg",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C97C5D]";

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
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
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
  const reduce = useReducedMotion();
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
      <motion.div
        className={`relative w-full ${reduce ? "h-full" : "h-[115%]"}`}
        style={reduce ? undefined : { y }}
      >
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />
      </motion.div>
    </div>
  );
}

// ─── Shared bits ───────────────────────────────────────────
function Eyebrow({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <p
      className="text-[11px] font-medium uppercase tracking-[0.35em]"
      style={{ color }}
    >
      {children}
    </p>
  );
}

// Continuous, gentle idle float — transform-only (y/rotate) so it stays
// on the compositor. Defaults match Panel 5's original float; Panel 3
// passes a distinct rhythm per card. The outer div carries layout
// classes so static Tailwind transforms (e.g. -rotate-2) don't fight
// the animated inner transform.
function Float({
  children,
  className = "",
  amplitude = 5,
  duration = 5,
  delay = 0,
  rotation = 0,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
  delay?: number;
  rotation?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <div className={className}>
      <motion.div
        animate={{
          y: [0, -amplitude, 0],
          ...(rotation !== 0 ? { rotate: [0, rotation, 0] } : {}),
        }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Panel 1: Nav + Hero ───────────────────────────────────
function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link
          href="/"
          className={`text-lg font-semibold lowercase tracking-tight ${focusRing}`}
          style={{ color: c.creamText }}
        >
          stillroom
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className={`hidden px-3 py-2 text-sm transition-opacity hover:opacity-100 sm:block ${focusRing}`}
                style={{ color: "rgba(243,237,223,0.7)" }}
              >
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className={`rounded-full border px-5 py-2 text-sm transition-colors hover:bg-white/10 ${focusRing}`}
                style={{
                  color: c.creamText,
                  borderColor: "rgba(243,237,223,0.4)",
                }}
              >
                Get early access
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard/albums"
              className={`rounded-full border px-5 py-2 text-sm transition-colors hover:bg-white/10 ${focusRing}`}
              style={{
                color: c.creamText,
                borderColor: "rgba(243,237,223,0.4)",
              }}
            >
              Open my albums
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

function HeroPanel() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const [heroMissing, setHeroMissing] = useState(false);

  return (
    <section
      ref={ref}
      className="relative h-screen min-h-[640px] overflow-hidden"
      style={{
        // Warm dark wood fallback so the hero reads as intentional
        // until /hero-album.jpg lands.
        background:
          "linear-gradient(155deg, #46331F 0%, #33241A 40%, #201610 75%, #150E09 100%)",
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { scale }}
        aria-hidden="true"
      >
        {!heroMissing && (
          <Image
            src="/hero-album.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            onError={() => setHeroMissing(true)}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(85% 70% at 50% 45%, rgba(0,0,0,0) 40%, rgba(12,7,3,0.55) 100%)",
          }}
        />
      </motion.div>

      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-6"
        style={reduce ? undefined : { y }}
      >
        <motion.div
          className="w-full max-w-xl text-center shadow-[0_40px_90px_rgba(0,0,0,0.5)]"
          style={{
            background: "linear-gradient(180deg, #F7F1E4 0%, #F0E7D4 100%)",
          }}
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="m-3 border px-4 py-10 sm:m-4 sm:px-10 sm:py-14"
            style={{ borderColor: "rgba(28,23,18,0.18)" }}
          >
            <h1
              className="text-[1.75rem] leading-[1.22] font-medium sm:text-4xl md:text-[2.75rem]"
              style={{ fontFamily: "var(--font-serif)", color: c.ink }}
            >
              Some <em>moments</em>
              <br />
              deserve more than
              <br />
              disappearing into
              <br />a camera roll.
            </h1>
            <p
              className="mt-8 text-[9px] uppercase leading-relaxed tracking-[0.22em] sm:text-[11px] sm:tracking-[0.32em]"
              style={{ color: c.mutedLight }}
            >
              A shared space for the people and
              <br />
              memories that matter most.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <div
        className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5"
        style={{ color: "rgba(243,237,223,0.6)" }}
      >
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </motion.span>
        <span className="text-xs tracking-widest">Scroll</span>
      </div>
    </section>
  );
}

// ─── Panel 2: The album spread ─────────────────────────────
function BotanicalFlourish() {
  return (
    <svg
      viewBox="0 0 140 90"
      className="mt-10 h-auto w-28 opacity-60"
      aria-hidden="true"
      fill="none"
      stroke="#A08A5F"
      strokeWidth="1.1"
      strokeLinecap="round"
    >
      <path d="M8 84 C 44 68, 78 44, 124 10" />
      <path d="M38 70 C 34 60, 36 52, 44 46 C 46 56, 44 64, 38 70 Z" />
      <path d="M62 55 C 56 47, 56 38, 62 31 C 66 40, 66 48, 62 55 Z" />
      <path d="M86 40 C 79 34, 77 26, 81 18 C 87 25, 89 33, 86 40 Z" />
      <path d="M52 62 C 60 62, 67 58, 71 51" />
      <path d="M76 46 C 84 45, 90 41, 94 34" />
      <circle cx="126" cy="9" r="2.2" fill="#A08A5F" stroke="none" />
      <circle cx="118" cy="17" r="1.6" fill="#A08A5F" stroke="none" />
    </svg>
  );
}

function Print({
  src,
  alt,
  className = "",
  aspect,
  sizes = "(max-width: 768px) 55vw, 320px",
}: {
  src: string;
  alt: string;
  className?: string;
  aspect: string;
  sizes?: string;
}) {
  return (
    <figure
      className={`bg-white p-1.5 pb-4 shadow-[0_16px_32px_rgba(50,38,20,0.25)] sm:p-2 sm:pb-5 ${className}`}
    >
      <div className={`relative ${aspect}`}>
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />
      </div>
    </figure>
  );
}

// Paper grain for the album spread. An SVG fractal-noise tile encoded
// as a data: URI and used as a repeating background-image: the browser
// rasterises it once and tiles it, which is far cheaper than a live
// `filter: url(#…)` over the panel (that would repaint on every
// scroll). feColorMatrix throws away the noise RGB and keeps only a
// constant warm-brown ink whose alpha is driven by the noise, so the
// tile is pure translucent speckle. stitchTiles keeps the tile
// seamless, and a fixed backgroundSize keeps the fibre the same
// physical scale at every viewport width.
const PAPER_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.28 0 0 0 0 0.22 0 0 0 0 0.14 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23g)'/%3E%3C/svg%3E")`;

function AlbumSpreadPanel() {
  return (
    <section
      className="px-4 py-20 sm:px-6 md:px-10 md:py-32"
      style={{ background: c.cream }}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div
            className="relative rounded-md"
            style={{
              backgroundColor: c.page,
              // Tonal drift: real paper is never one flat value. Two or
              // three large, low-opacity radial washes, each off-centre
              // and a different size, so the sheet lightens toward the
              // upper left and deepens toward the outer corners without
              // ever reading as a symmetric vignette.
              backgroundImage: [
                "radial-gradient(120% 95% at 22% 10%, rgba(255,253,245,0.55) 0%, rgba(255,253,245,0) 52%)",
                "radial-gradient(95% 85% at 88% 100%, rgba(96,76,47,0.06) 0%, rgba(96,76,47,0) 58%)",
                "radial-gradient(55% 60% at 100% 6%, rgba(96,76,47,0.045) 0%, rgba(96,76,47,0) 55%)",
              ].join(", "),
              border: `1px solid ${c.line}`,
              // A stack, not a cutout: hairline strata peeking out under
              // the bottom edge (each "sheet" a shade darker, slightly
              // narrower via negative spread, and nudged off-axis so
              // they don't align), a whisper of top-edge thickness, and
              // the ambient drop shadow the panel already had.
              boxShadow: [
                "inset 0 1px 0 rgba(255,255,250,0.65)",
                "0 2px 0 -1px #F0E8D5",
                "1px 4px 0 -2px #E7DDC6",
                "-1px 6px 1px -3px #DBCFB2",
                "0 14px 30px rgba(60,45,25,0.10)",
                "0 40px 90px rgba(60,45,25,0.18)",
              ].join(", "),
            }}
          >
            {/* Paper grain — tiled noise, felt more than seen. It sits
                below the content grid (which is position:relative) so
                the heading, body copy, label and prints all paint on
                top of it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-md"
              style={{
                backgroundImage: PAPER_GRAIN,
                backgroundSize: "260px 260px",
                opacity: 0.055,
              }}
            />

            {/* Centre gutter — the page fold. A bound book's centre has
                depth: darkest right at the crease, falling away over a
                couple of inches on both sides, with a soft highlight
                where each page lifts back toward the light. The two
                sides are deliberately not mirror images, and a faint
                cockle sits just left of the fold. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-28 -translate-x-1/2 md:block lg:w-36"
              style={{
                background: [
                  // page-lift highlights, one per side, unequal
                  "linear-gradient(90deg, rgba(255,254,247,0) 10%, rgba(255,254,247,0.45) 31%, rgba(255,254,247,0) 45%, rgba(255,254,247,0) 57%, rgba(255,254,247,0.35) 67%, rgba(255,254,247,0) 88%)",
                  // soft cockle just left of the fold
                  "linear-gradient(90deg, rgba(72,56,32,0) 16%, rgba(72,56,32,0.03) 21%, rgba(255,254,247,0.18) 25%, rgba(72,56,32,0) 30%)",
                  // the fold itself, asymmetric falloff
                  "linear-gradient(90deg, rgba(72,56,32,0) 0%, rgba(72,56,32,0.02) 24%, rgba(72,56,32,0.07) 40%, rgba(64,49,27,0.17) 48.5%, rgba(56,42,22,0.28) 50%, rgba(64,49,27,0.15) 51.5%, rgba(72,56,32,0.06) 61%, rgba(72,56,32,0.015) 78%, rgba(72,56,32,0) 100%)",
                ].join(", "),
              }}
            />

            <div className="relative grid md:grid-cols-2">
              {/* Left page */}
              <div className="flex min-h-[380px] flex-col justify-between p-8 sm:p-12 md:min-h-[520px] md:p-14">
                <div>
                  <h2
                    className="text-3xl leading-[1.18] font-medium sm:text-4xl md:text-5xl"
                    style={{ fontFamily: "var(--font-serif)", color: c.ink }}
                  >
                    The trips,
                    <br />
                    the reunions,
                    <br />
                    the celebrations.
                  </h2>
                  <p
                    className="mt-6 max-w-xs text-sm leading-relaxed md:text-base"
                    style={{ color: c.mutedLight }}
                  >
                    The little moments that become your favorite memories.
                  </p>

                  {/* Taped scrapbook label — a slip of paper held to the
                      page by two strips of translucent tape. Sits in flow
                      in the empty run between the body copy and the
                      flourish, so it can never collide with either at any
                      breakpoint. Nothing here is allowed to align: the
                      slip, each tape strip and each torn tape end all sit
                      at their own angle — parallel geometry is what reads
                      as CSS. */}
                  <div className="relative mt-10 w-max max-w-full md:ml-2 md:mt-14">
                    <div
                      className="relative -rotate-[2.5deg] py-3.5 pl-5 pr-7 sm:py-4 sm:pl-6 sm:pr-9"
                      style={{
                        // A shade warmer + deeper than the page (#FCF8EF)
                        // so the slip separates without any border stroke.
                        background:
                          "linear-gradient(116deg, #FAF3E2 0%, #F6EDD9 58%, #F0E4CB 100%)",
                        // Contact shadow: tight and dark near the pinned
                        // (taped) corners, offset + diffuse at the free
                        // edges where the paper lifts.
                        boxShadow: [
                          "0 1px 1px rgba(76,60,35,0.16)",
                          "-3px 5px 9px rgba(76,60,35,0.10)",
                          "4px 9px 22px rgba(76,60,35,0.10)",
                        ].join(", "),
                      }}
                    >
                      <p
                        className="text-[10px] font-medium uppercase leading-[2.15] tracking-[0.22em] sm:text-[11px]"
                        style={{
                          fontFamily: "var(--font-serif)",
                          color: "#443626",
                        }}
                      >
                        Unscripted.
                        <br />
                        Unposed.
                        <br />
                        Exactly how it felt.
                      </p>

                      {/* Tape, top-left corner. Translucent alpha whites
                          let the slip and page show through; the gradient
                          runs across the strip's width as a faint sheen;
                          the clip-path tears both short ends; a hairline
                          blur takes the razor edge off the polygon. */}
                      <span
                        aria-hidden="true"
                        className="absolute -left-5 -top-3 h-5 w-14 sm:w-16"
                        style={{
                          rotate: "-38deg",
                          background:
                            "linear-gradient(172deg, rgba(250,252,255,0.18) 0%, rgba(255,255,255,0.46) 42%, rgba(243,247,250,0.20) 74%, rgba(250,252,255,0.34) 100%)",
                          boxShadow: "0 1px 2px rgba(76,60,35,0.10)",
                          clipPath:
                            "polygon(0% 14%, 6% 0%, 95% 4%, 100% 32%, 96% 54%, 100% 83%, 94% 100%, 5% 97%, 0% 72%, 4% 46%)",
                          filter: "blur(0.4px)",
                        }}
                      />
                      {/* Tape, bottom-right corner — longer strip, its own
                          angle, its own tear. */}
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-3 -right-6 h-[1.15rem] w-[4.75rem] sm:w-20"
                        style={{
                          rotate: "-49deg",
                          background:
                            "linear-gradient(186deg, rgba(252,253,255,0.34) 0%, rgba(244,248,251,0.16) 30%, rgba(255,255,255,0.42) 62%, rgba(248,251,253,0.20) 100%)",
                          boxShadow: "0 1px 2px rgba(76,60,35,0.10)",
                          clipPath:
                            "polygon(4% 0%, 96% 2%, 100% 26%, 95% 48%, 100% 70%, 96% 100%, 3% 96%, 0% 76%, 5% 52%, 0% 24%)",
                          filter: "blur(0.4px)",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <BotanicalFlourish />
              </div>

              {/* Right page — prints laid out like a real album */}
              <div className="p-5 pb-8 sm:p-8 md:p-10">
                <div className="relative aspect-[4/5]">
                  <Print
                    src={PHOTOS.friends}
                    alt="Friends gathered around a candlelit dinner table under string lights"
                    aspect="aspect-[4/3]"
                    className="absolute left-[1%] top-[1%] w-[56%] -rotate-2"
                  />
                  <Print
                    src={PHOTOS.family2}
                    alt="A young family sitting together in a poppy field at golden hour"
                    aspect="aspect-[3/4]"
                    className="absolute right-0 top-[5%] w-[37%] rotate-[2.5deg]"
                    sizes="(max-width: 768px) 40vw, 220px"
                  />
                  <Print
                    src={PHOTOS.exploring}
                    alt="A hiker walking into a wildflower valley"
                    aspect="aspect-square"
                    className="absolute left-[4%] top-[42%] w-[30%] rotate-[1.5deg]"
                    sizes="(max-width: 768px) 32vw, 180px"
                  />
                  <Print
                    src={PHOTOS.graduation}
                    alt="Graduates throwing their caps into a sunset sky"
                    aspect="aspect-[4/3]"
                    className="absolute bottom-0 right-[1%] w-[54%] -rotate-1"
                  />
                  {/* Handwritten card */}
                  <div className="absolute left-[26%] top-[52%] z-10 w-[48%] -rotate-3 bg-white px-4 py-5 text-center shadow-[0_14px_28px_rgba(50,38,20,0.22)]">
                    <p
                      className="text-xl leading-snug sm:text-2xl"
                      style={{
                        fontFamily: "var(--font-script)",
                        color: "#3A3128",
                      }}
                    >
                      The ones you never want to forget.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Panel 3: The problem ──────────────────────────────────
function AirDropCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-64 rounded-2xl bg-[#F2F2F7] p-4 text-center shadow-[0_24px_48px_rgba(0,0,0,0.4)] ${className}`}
    >
      <p className="text-sm font-semibold text-[#111]">AirDrop</p>
      <p className="mt-1.5 text-xs leading-relaxed text-[#3C3C43]">
        &ldquo;Sarah&rsquo;s iPhone&rdquo; would like to share 23 photos
      </p>
      <div className="mt-3 flex gap-2">
        <span className="flex-1 rounded-full bg-[#E2E2E8] py-1.5 text-xs font-medium text-[#111]">
          Decline
        </span>
        <span className="flex-1 rounded-full bg-[#0A84FF] py-1.5 text-xs font-semibold text-white">
          Accept
        </span>
      </div>
    </div>
  );
}

function ChatBubble({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-max max-w-[220px] rounded-2xl rounded-br-md bg-[#0A84FF] px-3.5 py-2 text-xs text-white shadow-[0_16px_32px_rgba(0,0,0,0.4)] ${className}`}
    >
      Too bad it&rsquo;s compressed 😅
    </div>
  );
}

function MessageThreadCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-72 rounded-2xl bg-white p-4 shadow-[0_24px_48px_rgba(0,0,0,0.4)] ${className}`}
    >
      <div className="flex items-center gap-2.5 border-b border-black/5 pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#C97C5D] to-[#8C5638] text-[10px] font-semibold text-white">
          GC
        </span>
        <span className="flex-1 text-sm font-semibold text-[#111]">
          Graduation Crew
        </span>
        <MoreHorizontal className="h-4 w-4 text-[#8E8E93]" />
      </div>
      <div className="mt-3 space-y-2 text-xs leading-snug">
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#E9E9EB] px-3 py-2 text-[#111]">
          Does anyone have the photos from yesterday?
        </div>
        <div className="max-w-[70%] rounded-2xl rounded-bl-md bg-[#E9E9EB] px-3 py-2 text-[#111]">
          I think Alex has them
        </div>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#0A84FF] px-3 py-2 text-white">
          Wait I thought you uploaded them?
        </div>
        <div className="flex items-end gap-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6B8E6B] text-[8px] font-semibold text-white">
            A
          </span>
          <div>
            <p className="mb-0.5 text-[9px] text-[#8E8E93]">Alex</p>
            <div className="rounded-2xl rounded-bl-md bg-[#E9E9EB] px-3 py-2 text-[#111]">
              Oh shoot yeah sorry!
            </div>
          </div>
        </div>
        <div className="flex gap-1 pl-7">
          {["😅", "🙃", "💀"].map((e) => (
            <span
              key={e}
              className="rounded-full border border-black/5 bg-[#F2F2F7] px-1.5 py-0.5 text-[10px]"
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CameraRollCard({ className = "" }: { className?: string }) {
  const order: (keyof typeof PHOTOS)[] = [
    "travel",
    "family",
    "graduation",
    "exploring",
    "friends",
    "adventure",
    "family2",
    "graduation",
    "travel",
    "friends",
    "exploring",
    "family",
  ];
  return (
    <div
      className={`w-52 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0B0B0F] pb-2 shadow-[0_30px_60px_rgba(0,0,0,0.5)] ${className}`}
    >
      {/* status bar */}
      <div className="flex items-center justify-between px-5 pt-2.5 text-[9px] font-medium text-white/80">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
          <span className="inline-block h-2 w-4 rounded-[3px] border border-white/60 bg-white/80" />
        </span>
      </div>
      <div className="flex items-center justify-between px-3 pb-1 pt-2 text-[10px] text-[#0A84FF]">
        <span>&lsaquo; Albums</span>
        <span>Select</span>
      </div>
      <div className="px-3 pb-2">
        <p className="text-sm font-semibold text-white">Camera Roll</p>
        <p className="text-[9px] text-white/50">1,482 photos</p>
      </div>
      <div className="grid grid-cols-3 gap-px">
        {order.map((k, i) => (
          <div key={`${k}-${i}`} className="relative aspect-square">
            <Image
              src={PHOTOS[k]}
              alt=""
              fill
              className="object-cover"
              sizes="70px"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FileChip({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-max items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 shadow-[0_16px_32px_rgba(0,0,0,0.4)] ${className}`}
    >
      <FileImage className="h-5 w-5 text-[#0A84FF]" />
      <div>
        <p className="text-xs font-medium text-[#111]">IMG_3921.jpeg</p>
        <p className="text-[10px] text-[#8E8E93]">2.1 MB</p>
      </div>
    </div>
  );
}

function ProblemPanel() {
  return (
    <section
      className="px-6 py-20 md:px-10 md:py-32"
      style={{ background: c.panelDark }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-12">
        <div>
          <Reveal>
            <Eyebrow color={c.mutedDark}>But the reality is&hellip;</Eyebrow>
            <h2
              className="mt-7 text-3xl leading-[1.18] font-medium sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <span className="block" style={{ color: c.tan }}>
                They&rsquo;re scattered across ten different phones.
              </span>
              <span className="mt-5 block" style={{ color: c.creamText }}>
                Someone always forgets to send them.
              </span>
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="relative lg:h-[640px]" aria-hidden="true">
            {/* Blurred photo backdrop */}
            <div className="absolute -inset-4 overflow-hidden rounded-3xl">
              <Image
                src={PHOTOS.friends}
                alt=""
                fill
                className="scale-105 object-cover opacity-15 blur-md"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Scattered mockups: stacked on mobile, scattered on lg.
                Each floats on its own rhythm — heavier cards drift slower
                and less, lighter ones a touch more and faster. */}
            <div className="relative flex flex-col items-center gap-6 py-6 lg:block lg:h-full lg:py-0">
              <Float
                className="-rotate-2 lg:absolute lg:left-6 lg:top-10"
                amplitude={9}
                duration={6.5}
                rotation={0.8}
              >
                <AirDropCard />
              </Float>
              <Float
                className="hidden rotate-2 lg:absolute lg:right-56 lg:top-1 lg:block"
                amplitude={12}
                duration={4.5}
                delay={0.7}
                rotation={-1.2}
              >
                <ChatBubble />
              </Float>
              <Float
                className="rotate-3 lg:absolute lg:right-0 lg:top-6"
                amplitude={6}
                duration={8.5}
                delay={0.4}
                rotation={-0.6}
              >
                <CameraRollCard />
              </Float>
              <Float
                className="z-10 rotate-[1.5deg] lg:absolute lg:left-0 lg:top-60"
                amplitude={5}
                duration={9}
                delay={1.1}
                rotation={0.5}
              >
                <MessageThreadCard />
              </Float>
              <Float
                className="hidden -rotate-3 lg:absolute lg:bottom-8 lg:left-44 lg:block"
                amplitude={14}
                duration={5.2}
                delay={1.6}
                rotation={1.4}
              >
                <FileChip className="flex" />
              </Float>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Panel 4: Meet stillroom ───────────────────────────────
function MockAlbumRow({
  src,
  label,
  active = false,
}: {
  src: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-2 py-1.5 ${
        active ? "bg-[#EFE7D5]" : ""
      }`}
    >
      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
        <Image src={src} alt="" fill className="object-cover" sizes="24px" />
      </span>
      <span
        className={`truncate text-xs ${active ? "font-semibold" : ""}`}
        style={{ color: active ? c.ink : "#5D5344" }}
      >
        {label}
      </span>
    </div>
  );
}

function MockMosaicTile({ src, aspect }: { src: string; aspect: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${aspect}`}>
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 768px) 30vw, 200px"
      />
    </div>
  );
}

function AppMock() {
  return (
    <div
      aria-hidden="true"
      className="flex overflow-hidden rounded-2xl border bg-white shadow-[0_50px_100px_rgba(60,45,25,0.28)]"
      style={{ borderColor: c.line }}
    >
      {/* Sidebar */}
      <div
        className="hidden w-52 shrink-0 flex-col border-r bg-[#FAF6EE] px-3 py-5 sm:flex"
        style={{ borderColor: c.line }}
      >
        <p
          className="px-2 text-base font-bold lowercase tracking-tight"
          style={{ color: c.ink }}
        >
          stillroom
        </p>
        <div className="mt-5 space-y-0.5">
          <div className="flex items-center gap-2.5 rounded-full px-3 py-1.5 text-xs text-[#5D5344]">
            <Home className="h-3.5 w-3.5 text-[#8A7D6A]" /> Home
          </div>
          <div className="flex items-center gap-2.5 rounded-full px-3 py-1.5 text-xs font-medium text-[#1C1712]">
            <Images className="h-3.5 w-3.5 text-[#8A7D6A]" /> Albums
          </div>
        </div>
        <p className="mb-1.5 mt-6 px-2 text-[10px] font-medium text-[#9B8F7B]">
          Your albums
        </p>
        <div className="space-y-0.5">
          <MockAlbumRow src={PHOTOS.exploring} label="Bali 2024" active />
          <MockAlbumRow src={PHOTOS.graduation} label="Graduation" />
          <MockAlbumRow src={PHOTOS.family} label="Family Weekend" />
          <MockAlbumRow src={PHOTOS.travel} label="Japan Trip" />
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-full px-2 py-1.5 text-[#8A7D6A]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[#B4A88F]">
            <Plus className="h-3 w-3" />
          </span>
          <span className="text-xs">New album</span>
        </div>
        <div
          className="mt-auto flex items-center gap-2 border-t px-2 pt-4"
          style={{ borderColor: c.line }}
        >
          <span className="relative h-6 w-6 overflow-hidden rounded-full">
            <Image
              src={PHOTOS.family2}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </span>
          <span className="text-xs font-medium" style={{ color: c.ink }}>
            Lena Ortiz
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="min-w-0 flex-1 px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: c.ink }}
            >
              Bali 2024
            </p>
            <p className="mt-1 text-xs" style={{ color: c.mutedLight }}>
              128 photos · 6 people · Created April 2024
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {[PHOTOS.family2, PHOTOS.friends, PHOTOS.exploring].map((s) => (
                <span
                  key={s}
                  className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-white"
                >
                  <Image
                    src={s}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </span>
              ))}
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#EFE7D5] text-[9px] font-semibold text-[#5D5344]">
                +3
              </span>
            </div>
            <span
              className="ml-3 rounded-full px-3.5 py-1.5 text-xs font-medium"
              style={{ background: c.ink, color: c.creamText }}
            >
              Invite
            </span>
          </div>
        </div>

        {/* Mosaic grid */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-2">
            <MockMosaicTile src={PHOTOS.exploring} aspect="aspect-[3/4]" />
            <MockMosaicTile src={PHOTOS.adventure} aspect="aspect-square" />
          </div>
          <div className="flex flex-col gap-2">
            <MockMosaicTile src={PHOTOS.travel} aspect="aspect-square" />
            <MockMosaicTile src={PHOTOS.family} aspect="aspect-[3/4]" />
          </div>
          <div className="flex flex-col gap-2">
            <MockMosaicTile src={PHOTOS.friends} aspect="aspect-[3/4]" />
            <MockMosaicTile src={PHOTOS.graduation} aspect="aspect-square" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetStillroomPanel() {
  return (
    <section
      className="overflow-hidden py-20 md:py-32"
      style={{ background: c.cream }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:px-10 lg:grid-cols-[5fr_7fr] lg:gap-12">
        <div>
          <Reveal>
            <Eyebrow color={c.terracotta}>Meet stillroom</Eyebrow>
            <h2
              className="mt-7 text-3xl leading-[1.18] font-medium sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <span className="block" style={{ color: c.ink }}>
                The feeling of a physical album.
              </span>
              <span className="mt-5 block" style={{ color: c.tan }}>
                The convenience of a digital link.
              </span>
            </h2>
            <p
              className="mt-7 max-w-md text-base leading-relaxed"
              style={{ color: c.mutedLight }}
            >
              One beautiful space for everyone to add, view, and relive
              memories together.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="lg:-mr-24 xl:-mr-32">
            <AppMock />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Panel 5: For photographers ────────────────────────────
function DeliveryStatusRow({
  icon,
  label,
  detail,
  expandable = false,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  expandable?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium" style={{ color: c.creamText }}>
          {label}
        </p>
        <p className="text-[11px]" style={{ color: c.mutedDark }}>
          {detail}
        </p>
      </div>
      {expandable && (
        <ChevronRight
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-white/35"
        />
      )}
    </li>
  );
}

function DeliveryTile({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-square overflow-hidden md:aspect-auto ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 190px"
      />
    </div>
  );
}

function PhotographersPanel() {
  return (
    <section
      className="px-6 py-20 md:px-10 md:py-32"
      style={{ background: c.panelDarker }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[5fr_7fr] lg:gap-14">
        <div>
          <Reveal>
            <Eyebrow color={c.mutedDark}>
              Made for the people
              <br />
              behind the camera
            </Eyebrow>
            <h2
              className="mt-7 text-3xl leading-[1.18] font-medium sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-serif)", color: c.creamText }}
            >
              A better way to
              <br />
              deliver the memories.
            </h2>
            <p
              className="mt-6 max-w-md text-base leading-relaxed"
              style={{ color: c.mutedDark }}
            >
              For photographers, too. Create a Stillroom, upload the final
              album, and send your clients one beautiful link they can keep
              coming back to.
            </p>
            <p
              className="mt-4 max-w-md text-base leading-relaxed"
              style={{ color: c.mutedDark }}
            >
              Every link carries your name and theirs &mdash; it feels like
              handing over an album, not a file transfer.
            </p>
            <div className="mt-9">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button
                    className={`rounded-full border px-7 py-3 text-sm transition-colors hover:bg-white/10 ${focusRing}`}
                    style={{
                      color: c.creamText,
                      borderColor: "rgba(243,237,223,0.4)",
                    }}
                  >
                    Create a Stillroom &rarr;
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard/albums"
                  className={`inline-block rounded-full border px-7 py-3 text-sm transition-colors hover:bg-white/10 ${focusRing}`}
                  style={{
                    color: c.creamText,
                    borderColor: "rgba(243,237,223,0.4)",
                  }}
                >
                  Create a Stillroom &rarr;
                </Link>
              </SignedIn>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mx-auto w-full max-w-xl lg:max-w-none">
            <div
              className="overflow-hidden rounded-3xl border border-white/10 md:grid md:grid-cols-[19.5rem_1fr] lg:grid-cols-[21rem_1fr]"
              style={{ background: c.cardDark }}
            >
              {/* Delivery summary */}
              <div className="p-6 sm:p-7 md:border-r md:border-white/10">
                <p
                  className="text-2xl"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: c.creamText,
                  }}
                >
                  Sarah &amp; James
                </p>
                <p className="mt-1 text-xs" style={{ color: c.mutedDark }}>
                  June 14, 2024
                </p>

                <span
                  className="mt-5 inline-block rounded-full border px-4 py-1.5 text-xs"
                  style={{
                    color: c.creamText,
                    borderColor: "rgba(243,237,223,0.4)",
                  }}
                >
                  Share link &rarr;
                </span>
                {/* break-words, not break-all: break-all splits the URL
                    mid-token and orphans stray characters on their own line.
                    The column is sized to fit this on one line; wrapping here
                    is only a safety net. */}
                <p
                  className="mt-3 break-words font-mono text-[11px] leading-relaxed"
                  style={{ color: c.mutedDark }}
                >
                  stillroom.com/lucas/share/sarah-james
                </p>
                <p className="mt-2 text-xs" style={{ color: c.mutedDark }}>
                  482 photos &middot; 2.3 GB
                </p>

                <ul className="mt-6 space-y-4 border-t border-white/10 pt-5">
                  <DeliveryStatusRow
                    icon={<Check className="h-3.5 w-3.5 text-[#8FBC8F]" />}
                    label="Upload complete"
                    detail="482 photos"
                  />
                  <DeliveryStatusRow
                    icon={<Check className="h-3.5 w-3.5 text-[#8FBC8F]" />}
                    label="Album delivered"
                    detail="Jun 15, 10:28 AM"
                  />
                  <DeliveryStatusRow
                    icon={
                      <Heart className="h-3.5 w-3.5 fill-[#E0483E] text-[#E0483E]" />
                    }
                    label="Sarah viewed album"
                    detail="Jun 16, 3:15 PM"
                    expandable
                  />
                </ul>
              </div>

              {/* Delivered album grid */}
              <div className="grid grid-cols-3 gap-1 border-t border-white/10 p-1 md:h-full md:grid-rows-3 md:border-t-0">
                <DeliveryTile
                  src={PHOTOS.friends}
                  alt="Wedding guests gathered around a candlelit dinner table under string lights"
                />
                <DeliveryTile
                  src={PHOTOS.family2}
                  alt="A couple sitting close together in a poppy field at golden hour"
                  className="[&>img]:object-top"
                />
                <DeliveryTile
                  src={PHOTOS.travel}
                  alt="A quiet coastal town at dusk"
                />
                <DeliveryTile
                  src={PHOTOS.exploring}
                  alt="Two people walking into a wildflower valley"
                />
                <DeliveryTile
                  src={PHOTOS.family}
                  alt="Family portrait in warm evening light"
                />
                <DeliveryTile
                  src={PHOTOS.adventure}
                  alt="Guests hiking a ridge line under a wide sky"
                  className="[&>img]:object-bottom"
                />
                <DeliveryTile
                  src={PHOTOS.graduation}
                  alt="Celebration caps thrown into a sunset sky"
                  className="hidden md:block"
                />
                <DeliveryTile
                  src={PHOTOS.friends}
                  alt="A toast between friends at the reception table"
                  className="hidden md:block [&>img]:object-left"
                />
                <DeliveryTile
                  src={PHOTOS.family2}
                  alt="The couple resting in the field as the light fades"
                  className="hidden md:block [&>img]:object-bottom"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Panel 6: Final CTA + footer ───────────────────────────
function FinalCtaPanel() {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-6 py-28">
      <ParallaxImage
        src={PHOTOS.travel}
        alt=""
        className="absolute inset-0"
        speed={0.06}
        sizes="100vw"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(247,242,233,0.85) 0%, rgba(247,242,233,0.6) 45%, rgba(247,242,233,0.88) 100%)",
        }}
      />

      <Reveal className="relative z-10 mx-auto max-w-3xl text-center">
        <h2
          className="text-4xl leading-[1.12] font-medium sm:text-6xl md:text-7xl"
          style={{ fontFamily: "var(--font-serif)", color: c.ink }}
        >
          Every memory.
          <br />
          <em>Together.</em>
        </h2>
        <div className="mt-11">
          <SignedOut>
            <SignUpButton mode="modal">
              <button
                className={`rounded-full px-8 py-4 text-sm font-medium transition-opacity hover:opacity-90 ${focusRing}`}
                style={{ background: c.ink, color: c.creamText }}
              >
                Start your first Stillroom &rarr;
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard/albums"
              className={`inline-block rounded-full px-8 py-4 text-sm font-medium transition-opacity hover:opacity-90 ${focusRing}`}
              style={{ background: c.ink, color: c.creamText }}
            >
              Start your first Stillroom &rarr;
            </Link>
          </SignedIn>
        </div>
        <p className="mt-6 text-sm" style={{ color: c.mutedLight }}>
          Get early access
        </p>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="border-t px-6 py-8 md:px-10"
      style={{ background: c.cream, borderColor: c.line }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
        <Link
          href="/"
          className={`text-sm font-semibold lowercase tracking-tight ${focusRing}`}
          style={{ color: c.ink }}
        >
          stillroom
        </Link>
        <p className="text-xs" style={{ color: c.mutedLight }}>
          &copy; {new Date().getFullYear()} stillroom. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ─── Main page ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div
      className={`min-h-screen ${serif.variable} ${script.variable}`}
      style={{ background: c.cream, color: c.ink }}
    >
      <Nav />
      <main>
        <HeroPanel />
        <AlbumSpreadPanel />
        <ProblemPanel />
        <MeetStillroomPanel />
        <PhotographersPanel />
        <FinalCtaPanel />
      </main>
      <Footer />
    </div>
  );
}
