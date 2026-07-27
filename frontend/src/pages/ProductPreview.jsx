import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import GiftPreview from '../components/GiftPreview';
import Button from '../components/Button';
import { PRODUCT_TYPES } from '../lib/constants';

const SIZES = {
  framed_print: ['8x10in', '11x14in', '16x20in'],
  canvas_print: ['12x12in', '16x16in', '20x20in'],
  photo_book: ['20 pages', '40 pages'],
};

export default function ProductPreview() {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [type, setType] = useState('framed_print');
  const [size, setSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/artworks/${artworkId}`)
      .then(({ data }) => setArtwork(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load this artwork.'))
      .finally(() => setLoading(false));
  }, [artworkId]);

  const addToCart = async () => {
    setAdding(true);
    setError('');
    try {
      await api.post('/products', { artworkId, type, size: size || undefined });
      navigate('/cart');
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t add this to your cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <p className="mx-auto max-w-4xl px-6 py-16 text-sm text-warmgray">Loading…</p>;
  if (!artwork) return <p className="mx-auto max-w-4xl px-6 py-16 text-sm text-red-700">{error || 'Artwork not found.'}</p>;

  const selectedProduct = PRODUCT_TYPES.find((p) => p.id === type);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Take it home</p>
      <h1 className="mt-2 font-display text-4xl italic">{artwork.title || 'Your piece'}</h1>
      <Link to={`/memories/${artwork.memory}`} className="mt-2 inline-block text-xs text-warmgray underline underline-offset-4">
        Back to memory
      </Link>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="rounded-sm bg-parchment-dim py-6">
          <GiftPreview type={type} imageUrl={artwork.imageUrl} />
        </div>

        <div>
          <p className="placard text-[10px] text-warmgray">Choose a product</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PRODUCT_TYPES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setType(p.id);
                  setSize('');
                }}
                className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                  type === p.id ? 'border-brass-deep bg-brass/10' : 'border-ink/15 hover:border-ink/30'
                }`}
              >
                <span className="block font-medium">{p.label}</span>
                <span className="placard text-[10px] text-warmgray">{p.priceLabel}</span>
              </button>
            ))}
          </div>

          {SIZES[type] && (
            <div className="mt-6">
              <p className="placard text-[10px] text-warmgray">Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SIZES[type].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`rounded-full border px-4 py-1.5 text-xs ${
                      size === s ? 'border-brass-deep bg-brass/10' : 'border-ink/15 hover:border-ink/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-6">
            <span className="font-display text-2xl italic">{selectedProduct?.priceLabel}</span>
            <Button variant="brass" onClick={addToCart} disabled={adding}>
              {adding ? 'Adding…' : 'Add to cart'}
            </Button>
          </div>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
