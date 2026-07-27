import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FramedArt from '../components/FramedArt';
import Button from '../components/Button';
import { ART_STYLES, PRODUCT_TYPES } from '../lib/constants';

const HERO_PIECES = [
  { title: 'First Trip, 2019', medium: 'Watercolor', meta: 'Joy', gradient: 'from-amber-200 via-orange-200 to-rose-200', tilt: -6, depth: 10 },
  { title: 'Sunday Kitchen', medium: 'Oil Painting', meta: 'Nostalgia', gradient: 'from-stone-300 via-amber-100 to-stone-200', tilt: 4, depth: 16 },
  { title: 'Cox’s Bazar, Dusk', medium: 'Vintage Poster', meta: 'Peace', gradient: 'from-sky-200 via-teal-100 to-emerald-200', tilt: -2, depth: 7 },
  { title: 'Old Dog, New House', medium: 'Pencil Sketch', meta: 'Bittersweet', gradient: 'from-stone-200 via-stone-100 to-stone-300', tilt: 7, depth: 19 },
  { title: 'The Engagement', medium: 'Pop Art', meta: 'Celebration', gradient: 'from-rose-300 via-fuchsia-200 to-violet-200', tilt: -9, depth: 12 },
];

const PROCESS = [
  {
    num: 'ACCN. 01',
    title: 'Share',
    body: 'A photo, a few lines about what happened, maybe a date. That’s already enough to start — voice notes and extra photos just sharpen the result.',
  },
  {
    num: 'ACCN. 02',
    title: 'Interpret',
    body: 'The model reads the mood in what you wrote — joy, nostalgia, celebration, peace — and lets that choose color and composition, not just a filter over your photo.',
  },
  {
    num: 'ACCN. 03',
    title: 'Hang',
    body: 'Preview it framed on a wall, printed on canvas, or bound into a memory book, then order whichever fits the person you’re making it for.',
  },
];

const OCCASIONS = [
  { title: 'Anniversaries', gradient: 'from-rose-200 via-rose-100 to-amber-100', tilt: -3 },
  { title: 'Baby Milestones', gradient: 'from-sky-100 via-blue-100 to-indigo-100', tilt: 2 },
  { title: 'Pet Memorials', gradient: 'from-stone-200 via-neutral-100 to-stone-100', tilt: -5 },
  { title: 'Travel Keepsakes', gradient: 'from-teal-100 via-emerald-100 to-lime-100', tilt: 4 },
];

const GUESTBOOK = [
  {
    quote: 'I sent three voice notes rambling about my grandmother’s garden. What came back looked like it knew her.',
    name: 'R. Ahmed',
    detail: 'Ordered a framed print',
  },
  {
    quote: 'We used it for our dog’s memorial. The pencil sketch style felt right in a way a photo print never would have.',
    name: 'L. Ferreira',
    detail: 'Ordered a canvas print',
  },
  {
    quote: 'The timeline feature turned four years of trip photos into something my parents actually hung up.',
    name: 'S. Chowdhury',
    detail: 'Ordered a memory book',
  },
];

// Soft blurred color fields for ambient background depth - purely decorative,
// always behind content, never intercepts clicks.
function AmbientBlobs({ variant = 'hero' }) {
  const blobs =
    variant === 'hero'
      ? [
          { className: 'h-72 w-72 bg-brass/20 -top-10 -left-10', duration: 16, delay: 0 },
          { className: 'h-96 w-96 bg-emerald/15 top-1/3 right-0', duration: 21, delay: 2 },
          { className: 'h-64 w-64 bg-brass/10 bottom-0 left-1/3', duration: 19, delay: 4 },
        ]
      : [
          { className: 'h-80 w-80 bg-emerald/10 top-0 right-1/4', duration: 20, delay: 1 },
        ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`animate-blob-drift absolute rounded-full blur-3xl ${b.className}`}
          style={{ '--blob-duration': `${b.duration}s`, '--blob-delay': `${b.delay}s` }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const galleryRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const onMouseMove = useCallback((e) => {
    if (reducedMotion.current || !galleryRef.current) return;
    const rect = galleryRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x, y });
  }, []);

  const onMouseLeave = useCallback(() => setParallax({ x: 0, y: 0 }), []);

  return (
    <div>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-ink text-parchment">
        <AmbientBlobs variant="hero" />
        <div className="relative mx-auto grid max-w-6xl gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <p className="placard text-[11px] text-brass-bright">AI-assisted, mood-tuned</p>
            <h1 className="mt-5 font-display text-5xl italic leading-[1.05] sm:text-6xl">
              Every memory
              <br />
              deserves a frame.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-parchment/70">
              Upload a photo, a voice note, or just a date you haven’t forgotten. We turn it
              into a one-of-one illustrated piece — watercolor, oil, pencil, or five styles more —
              ready to hang, gift, or keep.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button as={Link} to="/register" variant="brass" size="lg">
                Start a piece
              </Button>
              <Button as="a" href="#styles" variant="ghost" size="lg" className="text-parchment hover:bg-parchment/10">
                See the styles
              </Button>
            </div>
          </div>

          {/* Gallery wall - each piece has three independent transform layers:
              static position (top/left), mouse-parallax (JS, this wrapper),
              one-time settle-in (CSS), and FramedArt's own ambient float
              (on its own inner node) - kept on separate DOM nodes so none of
              these transforms fight each other in the CSS cascade. */}
          <div
            ref={galleryRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="relative hidden min-h-[420px] md:block"
          >
            {HERO_PIECES.map((piece, i) => (
              <div
                key={piece.title}
                className="absolute w-40 lg:w-48"
                style={{
                  top: `${[0, 18, 46, 8, 60][i]}%`,
                  left: `${[6, 52, 2, 62, 30][i]}%`,
                }}
              >
                <div
                  className="transition-transform duration-300 ease-out"
                  style={{
                    transform: `translate(${parallax.x * piece.depth}px, ${parallax.y * piece.depth}px)`,
                  }}
                >
                  <div className="animate-frame-settle" style={{ animationDelay: `${i * 110}ms` }}>
                    <FramedArt {...piece} onDark tilt={piece.tilt} index={i} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: simple horizontal scroll of the same pieces */}
          <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 md:hidden">
            {HERO_PIECES.map((piece, i) => (
              <div key={piece.title} className="w-36 shrink-0">
                <FramedArt {...piece} onDark tilt={0} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
        <p className="placard text-[11px] text-brass-deep">How a piece gets made</p>
        <h2 className="mt-3 max-w-lg font-display text-4xl italic leading-tight">
          Three steps, and the machine does the part that isn’t the memory.
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {PROCESS.map((step) => (
            <div key={step.num} className="border-t border-brass-deep/40 pt-5">
              <p className="placard text-[10px] text-warmgray">{step.num}</p>
              <h3 className="mt-3 font-display text-2xl italic">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-warmgray">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- STYLES */}
      <section id="styles" className="bg-parchment-dim py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="placard text-[11px] text-brass-deep">Seven ways to see it</p>
          <h2 className="mt-3 max-w-lg font-display text-4xl italic leading-tight">
            Every memory has a medium it wants to be told in.
          </h2>

          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {ART_STYLES.map((style, i) => (
              <FramedArt
                key={style.id}
                title={style.label}
                medium={style.blurb}
                gradient={
                  [
                    'from-blue-100 via-sky-50 to-teal-100',
                    'from-stone-100 via-neutral-50 to-stone-200',
                    'from-amber-200 via-orange-100 to-yellow-100',
                    'from-neutral-200 via-stone-100 to-neutral-100',
                    'from-red-200 via-orange-100 to-amber-100',
                    'from-fuchsia-200 via-pink-100 to-rose-100',
                    'from-emerald-100 via-teal-50 to-cyan-100',
                  ][i]
                }
                tilt={(i % 2 === 0 ? -1 : 1) * (2 + (i % 3))}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- OCCASIONS */}
      <section id="collection" className="mx-auto max-w-6xl px-6 py-24">
        <p className="placard text-[11px] text-brass-deep">Made for the moments that don’t fade</p>
        <h2 className="mt-3 max-w-lg font-display text-4xl italic leading-tight">
          Some days are worth mounting.
        </h2>

        <div className="mt-14 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {OCCASIONS.map((occ, i) => (
            <FramedArt key={occ.title} title={occ.title} gradient={occ.gradient} tilt={occ.tilt} index={i} />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- PRICING */}
      <section className="relative overflow-hidden bg-ink text-parchment">
        <AmbientBlobs variant="section" />
        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <p className="placard text-[11px] text-brass-bright">Take it home</p>
          <h2 className="mt-3 max-w-lg font-display text-4xl italic leading-tight">
            From your screen to your wall.
          </h2>

          <div className="mt-14 divide-y divide-parchment/10 border-y border-parchment/10">
            {PRODUCT_TYPES.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-5 transition-colors duration-200 hover:bg-parchment/5">
                <span className="font-body text-lg">{p.label}</span>
                <span className="placard text-sm text-brass-bright">{p.priceLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- GUESTBOOK */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="placard text-[11px] text-brass-deep">From the guestbook</p>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {GUESTBOOK.map((g) => (
            <figure key={g.name} className="flex flex-col">
              <blockquote className="font-display text-xl italic leading-snug text-ink/90">
                “{g.quote}”
              </blockquote>
              <figcaption className="placard mt-5 text-[10px] text-warmgray">
                {g.name} — {g.detail}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- FINAL CTA */}
      <section className="border-t border-ink/10 bg-parchment-dim">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-24 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-md font-display text-4xl italic leading-tight">
            Start with whatever you have. That’s usually enough.
          </h2>
          <Button as={Link} to="/register" variant="brass" size="lg">
            Start a piece — free to preview
          </Button>
        </div>
      </section>
    </div>
  );
}
