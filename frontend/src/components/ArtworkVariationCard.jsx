import { useState } from 'react';
import { Link } from 'react-router-dom';
import FramedArt from './FramedArt';

export default function ArtworkVariationCard({
  group,
  index,
  memoryTitle,
  styleGradients,
  onToggleFavorite,
  onRegenerate,
  regenerating,
}) {
  const [activeIdx, setActiveIdx] = useState(group.length - 1); // most recent take shown first
  const active = group[activeIdx];

  return (
    <div>
      <div className="relative">
        <FramedArt
          title={active.title || memoryTitle}
          medium={active.style.replace('_', ' ')}
          imageUrl={active.imageUrl}
          gradient={styleGradients[active.style]}
          index={index}
          float={!regenerating}
          generating={regenerating}
          zoomable={!regenerating}
        />
        <button
          onClick={() => onToggleFavorite(active._id)}
          aria-label={active.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm transition-transform hover:scale-110"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={active.isFavorite ? '#C9A15D' : 'none'}
            stroke={active.isFavorite ? '#C9A15D' : '#6b6558'}
            strokeWidth="2"
          >
            <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z" />
          </svg>
        </button>
      </div>

      {group.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            disabled={activeIdx === 0}
            aria-label="Previous take"
            className="text-warmgray disabled:opacity-30"
          >
            &#8249;
          </button>
          <span className="placard text-[9px] text-warmgray">
            {activeIdx + 1} / {group.length}
          </span>
          <button
            onClick={() => setActiveIdx((i) => Math.min(group.length - 1, i + 1))}
            disabled={activeIdx === group.length - 1}
            aria-label="Next take"
            className="text-warmgray disabled:opacity-30"
          >
            &#8250;
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <Link to={`/artworks/${active._id}/product`} className="text-xs text-warmgray underline underline-offset-4">
          Make a product
        </Link>
        <button
          onClick={() => onRegenerate(active._id)}
          disabled={regenerating}
          className="text-xs text-warmgray underline underline-offset-4 disabled:opacity-50"
        >
          {regenerating ? 'Generating…' : 'Try another take'}
        </button>
      </div>
    </div>
  );
}
