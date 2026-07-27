import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Timeline() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/timeline')
      .then(({ data }) => setData(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t build your timeline.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Your story so far</p>
      <h1 className="mt-2 font-display text-4xl italic">Timeline</h1>

      {loading && <p className="mt-10 text-sm text-warmgray">Reading your dates…</p>}
      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}

      {!loading && !error && data?.entries.length === 0 && (
        <p className="mt-10 max-w-md text-sm text-warmgray">
          Add a date to any memory — a first meeting, a trip, a milestone — and this page turns
          them into a connected story, in order.
        </p>
      )}

      {!loading && data?.narrative && (
        <p className="mt-10 font-display text-2xl italic leading-snug text-ink/90">“{data.narrative}”</p>
      )}

      {!loading && data?.entries.length > 0 && (
        <ol className="mt-14 space-y-10 border-l border-brass-deep/30 pl-8">
          {data.entries.map((entry, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-brass-deep" />
              <p className="placard text-[10px] text-warmgray">{entry.date}</p>
              {entry.label && <p className="mt-1 font-display text-xl italic">{entry.label}</p>}
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{entry.description}</p>
              {entry.memoryId && (
                <Link to={`/memories/${entry.memoryId}`} className="mt-2 inline-block text-xs text-warmgray underline underline-offset-4">
                  View this memory
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
