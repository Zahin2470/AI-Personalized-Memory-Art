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
  index = 0,
  onClick,
  style,
  className = '',
}) {
  const Wrapper = interactive ? 'button' : 'div';

  const floatStyle = float
    ? {
        '--float-delay': `${(index % 6) * 0.35}s`,
        '--float-duration': `${4.5 + (index % 4) * 0.5}s`,
      }
    : {};

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
