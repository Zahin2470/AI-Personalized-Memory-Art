import { useEffect, useState } from 'react';
import api from '../lib/api';
import { PRODUCT_TYPES } from '../lib/constants';

const STATUS_LABEL = {
  pending: 'Pending payment',
  paid: 'Paid — in progress',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const labelFor = (type) => PRODUCT_TYPES.find((p) => p.id === type)?.label || type;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/orders')
      .then(({ data }) => setOrders(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Order history</p>
      <h1 className="mt-2 font-display text-4xl italic">My orders</h1>

      {loading && <p className="mt-10 text-sm text-warmgray">Loading…</p>}
      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}
      {!loading && orders.length === 0 && <p className="mt-10 text-sm text-warmgray">No orders yet.</p>}

      <div className="mt-10 space-y-8">
        {orders.map((order) => (
          <div key={order._id} className="border-b border-ink/10 pb-8">
            <div className="flex items-center justify-between">
              <p className="placard text-[10px] text-warmgray">
                Order #{order._id.slice(-8)} · {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <span
                className={`placard text-[10px] ${
                  order.status === 'paid' || order.status === 'delivered' ? 'text-emerald' : 'text-warmgray'
                }`}
              >
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  {item.product?.previewUrl && (
                    <img src={item.product.previewUrl} alt="" className="h-12 w-12 rounded-sm object-cover" />
                  )}
                  <span className="flex-1 text-sm">
                    {item.product ? labelFor(item.product.type) : 'Item'} × {item.quantity}
                  </span>
                  <span className="placard text-xs">৳{Math.round((item.unitPriceCents * item.quantity) / 100).toLocaleString('en-US')}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-right font-display text-xl italic">৳{Math.round(order.totalCents / 100).toLocaleString('en-US')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
