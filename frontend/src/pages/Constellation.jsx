import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Seo from '../components/Seo';

const SIZE = 600;
const CENTER = SIZE / 2;
const GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

// A phyllotaxis (sunflower-seed) spiral - purely a layout device, not a real
// star chart - gives an organic, non-overlapping "constellation" feel that
// stays stable across reloads since it's deterministic, not randomized.
const positionFor = (index, total) => {
  const angle = index * GOLDEN_ANGLE;
  const radius = 16 * Math.sqrt(index + 1) * Math.min(1.4, 10 / Math.sqrt(total + 1));
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
};

export default function Constellation() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    api
      .get('/timeline')
      .then(({ data }) => setEntries(data.data.entries))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load your constellation.'))
      .finally(() => setLoading(false));
  }, []);

  const points = entries.map((entry, i) => ({ ...entry, ...positionFor(i, entries.length) }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Seo title="Constellation" description="Your memories, laid out as a radial star map." />
      <p className="placard text-[11px] text-brass-deep">A different shape for the same story</p>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-4xl italic">Constellation</h1>
        <Link to="/timeline" className="text-xs text-warmgray underline underline-offset-4">
          View as a list instead
        </Link>
      </div>

      {loading && <p className="mt-10 text-sm text-warmgray">Charting your memories…</p>}
      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p className="mt-10 max-w-md text-sm text-warmgray">
          Add a date to any memory and it’ll take its place here.
        </p>
      )}

      {!loading && entries.length > 0 && (
        <div className="relative mt-10 rounded-sm bg-ink-fixed py-8">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-xl">
            {points.slice(1).map((p, i) => (
              <line
                key={`line-${i}`}
                x1={points[i].x}
                y1={points[i].y}
                x2={p.x}
                y2={p.y}
                stroke="var(--color-brass)"
                strokeOpacity="0.25"
                strokeWidth="1"
              />
            ))}
            {points.map((p, i) => (
              <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={hovered === i ? 8 : 5} fill="var(--color-brass-bright)" className="transition-all duration-200" />
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
              </g>
            ))}
          </svg>

          {hovered !== null && (
            <div className="pointer-events-none absolute bottom-8 left-1/2 w-72 -translate-x-1/2 rounded-sm bg-parchment p-4 text-center shadow-lg">
              <p className="placard text-[10px] text-warmgray">{points[hovered].date}</p>
              {points[hovered].label && <p className="font-display text-lg italic">{points[hovered].label}</p>}
              <p className="mt-1 text-xs text-ink/70">{points[hovered].description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
