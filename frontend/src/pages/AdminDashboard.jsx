import { useEffect, useState } from 'react';
import api from '../lib/api';
import AdminNav from '../components/AdminNav';

const STATUS_LABEL = {
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load stats.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Behind the scenes</p>
      <h1 className="mt-2 font-display text-4xl italic">Admin</h1>

      <div className="mt-8">
        <AdminNav />
      </div>

      {loading && <p className="mt-10 text-sm text-warmgray">Loading…</p>}
      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}

      {stats && (
        <>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: 'Users', value: stats.userCount },
              { label: 'Memories', value: stats.memoryCount },
              { label: 'Artworks generated', value: stats.artworkCount },
              { label: 'Paid orders', value: stats.paidOrderCount },
            ].map((card) => (
              <div key={card.label} className="rounded-sm border border-ink/10 p-6">
                <p className="font-display text-4xl italic">{card.value.toLocaleString('en-US')}</p>
                <p className="placard mt-2 text-[10px] text-warmgray">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-sm border border-ink/10 p-6">
            <p className="placard text-[10px] text-warmgray">Revenue (paid + fulfilled orders)</p>
            <p className="mt-2 font-display text-3xl italic">
              ৳{Math.round(stats.revenueCents / 100).toLocaleString('en-US')}
            </p>
          </div>

          <div className="mt-10">
            <p className="placard text-[11px] text-brass-deep">Orders by status</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(stats.orderCountByStatus).map(([status, count]) => (
                <span key={status} className="placard rounded-full border border-ink/15 px-4 py-2 text-[10px]">
                  {STATUS_LABEL[status] || status}: {count}
                </span>
              ))}
              {Object.keys(stats.orderCountByStatus).length === 0 && (
                <p className="text-sm text-warmgray">No paid orders yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
