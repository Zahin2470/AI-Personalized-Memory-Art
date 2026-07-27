const ArtFill = ({ imageUrl, gradient, className = '' }) => (
  <div className={`bg-gradient-to-br ${gradient} ${className}`}>
    {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
  </div>
);

function FrameMockup({ imageUrl, gradient, canvas }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-sm bg-parchment-dim px-10 pb-8 pt-10">
        <div
          className={`w-48 bg-white p-3 ${canvas ? '' : 'ring-1 ring-ink/5'}`}
          style={{ boxShadow: 'var(--shadow-frame)' }}
        >
          <ArtFill imageUrl={imageUrl} gradient={gradient} className="aspect-[4/5] w-full" />
        </div>
      </div>
      <div className="-mt-1 h-2 w-56 rounded-full bg-ink/10 blur-sm" aria-hidden="true" />
    </div>
  );
}

function MugMockup({ imageUrl, gradient }) {
  return (
    <div className="flex justify-center py-6">
      <svg viewBox="0 0 220 180" className="w-56">
        <defs>
          <clipPath id="mug-panel">
            <rect x="38" y="42" width="112" height="96" rx="4" />
          </clipPath>
        </defs>
        <rect x="30" y="34" width="128" height="112" rx="10" fill="var(--color-parchment)" stroke="var(--color-ink)" strokeOpacity="0.1" />
        <path
          d="M158 58 C186 58 186 118 158 118"
          fill="none"
          stroke="var(--color-ink)"
          strokeOpacity="0.15"
          strokeWidth="10"
        />
        <foreignObject x="38" y="42" width="112" height="96" clipPath="url(#mug-panel)">
          <ArtFill imageUrl={imageUrl} gradient={gradient} className="h-full w-full" />
        </foreignObject>
      </svg>
    </div>
  );
}

function CushionMockup({ imageUrl, gradient }) {
  return (
    <div className="flex justify-center py-6">
      <div className="relative w-48">
        <div
          className="aspect-square overflow-hidden rounded-2xl"
          style={{ boxShadow: 'var(--shadow-frame)' }}
        >
          <ArtFill imageUrl={imageUrl} gradient={gradient} className="h-full w-full" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/25" />
        </div>
        {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos) => (
          <span key={pos} className={`absolute ${pos} h-2 w-2 rounded-full bg-brass-deep/40`} />
        ))}
      </div>
    </div>
  );
}

function BookMockup({ imageUrl, gradient }) {
  return (
    <div className="flex justify-center py-6">
      <div className="relative w-40">
        <div className="absolute -right-1.5 top-1 h-full w-full rounded-sm bg-parchment-line" />
        <div className="absolute -right-0.5 top-0.5 h-full w-full rounded-sm bg-white" />
        <div
          className="relative overflow-hidden rounded-sm"
          style={{ boxShadow: 'var(--shadow-frame)' }}
        >
          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-ink/25 to-transparent" />
          <ArtFill imageUrl={imageUrl} gradient={gradient} className="aspect-[3/4] w-full" />
        </div>
      </div>
    </div>
  );
}

function ScreenMockup({ imageUrl, gradient }) {
  return (
    <div className="flex flex-col items-center py-6">
      <div className="w-64 rounded-t-lg bg-ink p-2 pb-1">
        <div className="mb-2 flex gap-1.5 px-1">
          <span className="h-1.5 w-1.5 rounded-full bg-parchment/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-parchment/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-parchment/30" />
        </div>
        <ArtFill imageUrl={imageUrl} gradient={gradient} className="aspect-[16/10] w-full overflow-hidden rounded-sm" />
      </div>
      <div className="h-2 w-72 rounded-b-md bg-ink-soft" />
      <div className="mt-1 h-1 w-40 rounded-full bg-ink/20" />
    </div>
  );
}

/**
 * Renders a stylized (deliberately illustrated, not photorealistic) mockup
 * of the artwork on the chosen product - keeps the same editorial voice as
 * the rest of the app instead of faking product photography.
 */
export default function GiftPreview({ type, imageUrl, gradient = 'from-brass/30 via-parchment-dim to-emerald/20' }) {
  switch (type) {
    case 'mug':
      return <MugMockup imageUrl={imageUrl} gradient={gradient} />;
    case 'cushion':
      return <CushionMockup imageUrl={imageUrl} gradient={gradient} />;
    case 'photo_book':
      return <BookMockup imageUrl={imageUrl} gradient={gradient} />;
    case 'digital_download':
      return <ScreenMockup imageUrl={imageUrl} gradient={gradient} />;
    case 'canvas_print':
      return <FrameMockup imageUrl={imageUrl} gradient={gradient} canvas />;
    case 'framed_print':
    default:
      return <FrameMockup imageUrl={imageUrl} gradient={gradient} />;
  }
}
