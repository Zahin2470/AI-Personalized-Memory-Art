import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import FramedArt from '../components/FramedArt';

const STYLE_GRADIENTS = {
  watercolor: 'from-blue-100 via-sky-50 to-teal-100',
  minimalist: 'from-stone-100 via-neutral-50 to-stone-200',
  oil_painting: 'from-amber-200 via-orange-100 to-yellow-100',
  pencil_sketch: 'from-neutral-200 via-stone-100 to-neutral-100',
  vintage_poster: 'from-red-200 via-orange-100 to-amber-100',
  pop_art: 'from-fuchsia-200 via-pink-100 to-rose-100',
  abstract_collage: 'from-emerald-100 via-teal-50 to-cyan-100',
};

export default function Favorites() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/artworks', { params: { favorite: true } })
      .then(({ data }) => setArtworks(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load your favorites.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">The best of the collection</p>
      <h1 className="mt-2 font-display text-4xl italic">Favorites</h1>

      {loading && <p className="mt-16 text-sm text-warmgray">Loading…</p>}
      {error && <p className="mt-16 text-sm text-red-700">{error}</p>}

      {!loading && !error && artworks.length === 0 && (
        <div className="mt-20 max-w-md">
          <p className="font-display text-2xl italic text-ink/80">Nothing favorited yet.</p>
          <p className="mt-3 text-sm text-warmgray">
            Open any generated piece and tap the heart to keep it here.
          </p>
        </div>
      )}

      {artworks.length > 0 && (
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {artworks.map((a, i) => (
            <Link key={a._id} to={`/memories/${a.memory?._id || a.memory}`}>
              <FramedArt
                title={a.title || a.memory?.title}
                medium={a.style.replace('_', ' ')}
                imageUrl={a.imageUrl}
                gradient={STYLE_GRADIENTS[a.style]}
                index={i}
                zoomable
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
