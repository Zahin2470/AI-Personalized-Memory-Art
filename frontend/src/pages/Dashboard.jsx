import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import FramedArt from '../components/FramedArt';
import Button from '../components/Button';
import { EMOTION_LABELS } from '../lib/constants';
import Seo from '../components/Seo';

const EMOTION_GRADIENTS = {
  joy: 'from-amber-200 via-orange-100 to-yellow-100',
  nostalgia: 'from-stone-300 via-amber-100 to-stone-200',
  celebration: 'from-fuchsia-200 via-pink-100 to-violet-100',
  peace: 'from-sky-100 via-teal-50 to-emerald-100',
  love: 'from-rose-200 via-pink-100 to-rose-100',
  adventure: 'from-teal-200 via-emerald-100 to-lime-100',
  gratitude: 'from-lime-200 via-yellow-100 to-amber-100',
  bittersweet: 'from-neutral-300 via-stone-200 to-neutral-100',
};

export default function Dashboard() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [emotion, setEmotion] = useState('');

  // Debounce the search box so we're not firing a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    // Unlike the fetch-on-mount pattern elsewhere in this app, setLoading(true)
    // here genuinely IS synchronous within the effect body - not deferred to
    // a promise callback. That's intentional: it's the only way to signal
    // "a new fetch just started" the instant query/emotion change, which is
    // the standard search-as-you-type + loading-indicator pattern. There's
    // no derived value this could come from instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params = {};
    if (query) params.q = query;
    if (emotion) params.emotion = emotion;

    api
      .get('/memories', { params })
      .then(({ data }) => setMemories(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load your memories.'))
      .finally(() => setLoading(false));
  }, [query, emotion]);

  const hasFilters = query || emotion;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Seo title="My memories" description="Browse and search everything you’ve turned into art." />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="placard text-[11px] text-brass-deep">Your collection</p>
          <h1 className="mt-2 font-display text-4xl italic">My memories</h1>
        </div>
        <Button as={Link} to="/memories/new" variant="brass">
          + New memory
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search your memories…"
          className="w-full max-w-xs rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm focus:border-brass-deep focus:outline-none dark:border-parchment-line/20 dark:bg-ink-soft dark:text-parchment sm:w-64"
        />
        <div className="flex flex-wrap gap-2">
          {EMOTION_LABELS.map((e) => (
            <button
              key={e}
              onClick={() => setEmotion((prev) => (prev === e ? '' : e))}
              className={`placard rounded-full border px-3 py-1.5 text-[10px] capitalize transition-colors ${
                emotion === e ? 'border-brass-deep bg-brass/10 text-ink' : 'border-ink/15 text-warmgray hover:border-ink/30'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-16 text-sm text-warmgray">Loading your collection…</p>}
      {error && <p className="mt-16 text-sm text-red-700">{error}</p>}

      {!loading && !error && memories.length === 0 && hasFilters && (
        <div className="mt-20 max-w-md">
          <p className="font-display text-2xl italic text-ink/80">Nothing matches.</p>
          <p className="mt-3 text-sm text-warmgray">Try a different search or clear the mood filter.</p>
        </div>
      )}

      {!loading && !error && memories.length === 0 && !hasFilters && (
        <div className="mt-20 max-w-md">
          <p className="font-display text-2xl italic text-ink/80">Nothing mounted yet.</p>
          <p className="mt-3 text-sm text-warmgray">
            Add a photo, a few lines, or a date you don’t want to lose — that’s enough to
            start your first piece.
          </p>
          <Button as={Link} to="/memories/new" variant="primary" className="mt-6">
            Add your first memory
          </Button>
        </div>
      )}

      {!loading && memories.length > 0 && (
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {memories.map((m, i) => (
            <Link key={m._id} to={`/memories/${m._id}`}>
              {m.status === 'sealed' ? (
                <FramedArt
                  title={m.title || 'Sealed'}
                  medium="Memory Capsule"
                  meta={`Opens ${new Date(m.capsule.revealAt).toLocaleDateString()}`}
                  gradient="from-ink/20 via-brass/20 to-ink/10"
                  index={i}
                />
              ) : (
                <FramedArt
                  title={m.title || m.description?.slice(0, 28) || 'Untitled memory'}
                  medium={m.aiAnalysis?.emotion ? `Mood: ${m.aiAnalysis.emotion}` : 'Not analyzed yet'}
                  meta={m.status === 'analyzed' ? 'Ready' : 'Draft'}
                  gradient={EMOTION_GRADIENTS[m.aiAnalysis?.emotion] || 'from-stone-200 via-neutral-100 to-stone-100'}
                  imageUrl={m.photos?.[0]?.url}
                  index={i}
                  interactive
                  zoomable
                />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
