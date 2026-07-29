import { useEffect, useState } from 'react';
import api from '../lib/api';
import AdminNav from '../components/AdminNav';

const STATUS_FLOW = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api
      .get('/admin/orders')
      .then(({ data }) => setOrders(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    setError('');
    try {
      const { data } = await api.put(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.data : o)));
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t update that order.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Behind the scenes</p>
      <h1 className="mt-2 font-display text-4xl italic">Admin</h1>

      <div className="mt-8">
        <AdminNav />
      </div>

      {loading && <p className="mt-10 text-sm text-warmgray">Loading orders…</p>}
      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}

      <div className="mt-10 space-y-6">
        {orders.map((order) => (
          <div key={order._id} className="rounded-sm border border-ink/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-body text-sm font-medium">{order.user?.name || 'Unknown user'}</p>
                <p className="text-xs text-warmgray">{order.user?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="placard text-[10px] text-warmgray">
                  ৳{Math.round(order.totalCents / 100).toLocaleString('en-US')}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  disabled={updating === order._id}
                  className="rounded-md border border-ink/15 px-3 py-1.5 text-xs"
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {order.giftMessage && (
              <p className="mt-3 rounded-sm bg-parchment-dim px-3 py-2 text-xs italic text-ink/70">
                Gift note: “{order.giftMessage}”
              </p>
            )}

            <div className="mt-4 space-y-2">
              {order.items.map((item, i) => (
                <p key={i} className="text-xs text-warmgray">
                  {item.product?.type || 'item'} × {item.quantity}
                </p>
              ))}
            </div>

            <p className="placard mt-4 text-[10px] text-warmgray">
              Order #{order._id.slice(-8)} · {new Date(order.createdAt).toLocaleDateString()}
              {order.discountCode && ` · Code: ${order.discountCode}`}
            </p>
          </div>
        ))}

        {!loading && orders.length === 0 && <p className="text-sm text-warmgray">No orders yet.</p>}
      </div>
    </div>
  );
}
