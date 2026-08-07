import { useLightbox } from '../lib/lightbox';

/**
 * FramedArt - the one visual idea this whole app is built around: every
 * piece of generated art (or a placeholder for one) gets mounted like a
 * museum piece, with a small mono placard underneath. Reused everywhere:
 * the hero gallery wall, the style picker, the dashboard grid, and the
 * artwork gallery.
 *
 * Ambient motion: by default each piece drifts gently (a slow bob + tilt),
 * like hung art settling in still air - staggered per instance via `index`
 * so a grid of these doesn't bob in unison. Hover adds a separate, faster
 * lift on the frame itself. Pass `float={false}` to opt a specific instance
 * out.
 *
 * Pass `generating` while the AI is actively producing this piece - swaps
 * the plain "loading" treatment for a light sweep across the frame plus a
 * slow pulsing brass glow, since this is the single most "the AI is making
 * something" moment in the whole app and deserves more than static text.
 *
 * Pass `zoomable` to add a corner trigger that opens the image full-screen.
 * Deliberately a `<span role="button">`, not a real `<button>` - this
 * component's own Wrapper can already be a <button> (when `interactive`),
 * and browsers disallow nesting interactive controls; a real <button> here
 * would be invalid HTML. Also stops click propagation, so it works
 * correctly even when a parent wraps this whole card in a react-router
 * <Link> (Dashboard, Favorites) - zoom without triggering navigation.
 */
export default function FramedArt({
  imageUrl,
  gradient = 'from-brass/40 via-parchment-dim to-emerald/30',
  title,
  medium,
  meta,
  tilt = 0,
  onDark = false,
  selected = false,
  interactive = false,
  float = true,
  generating = false,
  zoomable = false,
  index = 0,
  onClick,
  style,
  className = '',
}) {
  const Wrapper = interactive ? 'button' : 'div';
  const { openLightbox } = useLightbox();

  const floatStyle = float
    ? {
        '--float-delay': `${(index % 6) * 0.35}s`,
        '--float-duration': `${4.5 + (index % 4) * 0.5}s`,
      }
    : {};

  const handleZoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openLightbox({ src: imageUrl, title, meta: medium });
  };

  const zoomTrigger = zoomable && imageUrl && (
    <span
      role="button"
      tabIndex={0}
      aria-label="View full size"
      onClick={handleZoom}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleZoom(e);
      }}
      className="absolute bottom-2 right-2 z-10 cursor-pointer rounded-full bg-ink-fixed/60 p-1.5 text-parchment-fixed opacity-0 transition-opacity group-hover:opacity-100"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      style={{ '--tilt': `${tilt}deg`, ...floatStyle, ...style }}
      className={`group text-left ${interactive ? 'cursor-pointer' : ''} ${
        float ? 'animate-ambient-float' : ''
      } ${className}`}
    >
      <div
        className={`frame-shadow frame-mat relative rounded-sm p-2 hover:-translate-y-1 ${
          selected ? 'ring-2 ring-brass ring-offset-2 ring-offset-transparent' : ''
        } ${generating ? 'animate-generation-pulse' : ''}`}
      >
        <div
          className={`relative aspect-[4/5] w-full overflow-hidden rounded-[1px] bg-gradient-to-br ${gradient} transition-transform duration-500 ${
            interactive ? 'group-hover:scale-[1.02]' : ''
          }`}
        >
          {imageUrl && (
            <img src={imageUrl} alt={title || 'Generated memory art'} className="h-full w-full object-cover" />
          )}
          {generating && (
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="animate-shimmer-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>
          )}
          {zoomTrigger}
        </div>
      </div>

      {(title || medium || meta) && (
        <div className={`mt-3 px-1 ${onDark ? 'text-parchment-fixed' : 'text-ink'}`}>
          {title && <p className="font-display text-lg italic leading-tight">{title}</p>}
          {(medium || meta) && (
            <p className={`placard mt-1 text-[10px] ${onDark ? 'text-brass-bright' : 'text-warmgray'}`}>
              {medium}
              {medium && meta ? ' · ' : ''}
              {meta}
            </p>
          )}
        </div>
      )}
    </Wrapper>
  );
}
