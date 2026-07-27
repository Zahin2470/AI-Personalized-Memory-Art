import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Button from '../components/Button';
import Field from '../components/Field';
import { PRODUCT_TYPES } from '../lib/constants';

const labelFor = (type) => PRODUCT_TYPES.find((p) => p.id === type)?.label || type;

export default function Cart() {
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [address, setAddress] = useState({
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Bangladesh',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/products', { params: { ordered: false } })
      .then(({ data }) => {
        setItems(data.data);
        setQuantities(Object.fromEntries(data.data.map((p) => [p._id, 1])));
      })
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load your cart.'))
      .finally(() => setLoading(false));
  }, []);

  const removeItem = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setItems((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t remove that item.');
    }
  };

  const totalCents = items.reduce((sum, p) => sum + p.priceCents * (quantities[p._id] || 1), 0);

  const checkout = async () => {
    setError('');
    if (!address.line1 || !address.phone) {
      setError('An address and phone number are needed to check out.');
      return;
    }

    setCheckingOut(true);
    try {
      const { data: orderRes } = await api.post('/orders', {
        items: items.map((p) => ({ productId: p._id, quantity: quantities[p._id] || 1 })),
        shippingAddress: address,
      });

      const { data: checkoutRes } = await api.post(`/orders/${orderRes.data._id}/checkout`);
      window.location.href = checkoutRes.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Try again.');
      setCheckingOut(false);
    }
  };

  if (loading) return <p className="mx-auto max-w-3xl px-6 py-16 text-sm text-warmgray">Loading your cart…</p>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Ready to hang</p>
      <h1 className="mt-2 font-display text-4xl italic">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-16">
          <p className="text-sm text-warmgray">Nothing in your cart yet.</p>
          <Button as={Link} to="/dashboard" variant="primary" className="mt-6">
            Back to my memories
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
            {items.map((p) => (
              <div key={p._id} className="flex items-center gap-4 py-5">
                {p.previewUrl && <img src={p.previewUrl} alt="" className="h-16 w-16 rounded-sm object-cover" />}
                <div className="flex-1">
                  <p className="font-body text-sm font-medium">{labelFor(p.type)}</p>
                  {p.size && <p className="text-xs text-warmgray">{p.size}</p>}
                </div>
                <input
                  type="number"
                  min={1}
                  value={quantities[p._id] || 1}
                  onChange={(e) =>
                    setQuantities((prev) => ({ ...prev, [p._id]: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  className="w-16 rounded-md border border-ink/15 px-2 py-1.5 text-center text-sm"
                />
                <span className="placard w-16 text-right text-xs">
                  ৳{Math.round((p.priceCents * (quantities[p._id] || 1)) / 100).toLocaleString('en-US')}
                </span>
                <button onClick={() => removeItem(p._id)} className="text-xs text-warmgray underline underline-offset-4">
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="placard text-[11px] text-brass-deep">Contact & delivery details</p>
            <p className="mt-2 text-xs text-warmgray">
              Needed for every order (including digital) - your payment provider requires it.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Phone number"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="sm:col-span-2"
              />
              <Field
                label="Address line"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                className="sm:col-span-2"
              />
              <Field label="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <Field label="State / Region" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              <Field label="Postal code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
              <Field label="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-ink/10 pt-6">
            <span className="font-display text-3xl italic">৳{Math.round(totalCents / 100).toLocaleString('en-US')}</span>
            <Button variant="brass" size="lg" onClick={checkout} disabled={checkingOut}>
              {checkingOut ? 'Redirecting to payment…' : 'Checkout'}
            </Button>
          </div>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        </>
      )}
    </div>
  );
}
