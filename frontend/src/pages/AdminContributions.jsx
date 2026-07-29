import { useEffect, useState } from 'react';
import api from '../lib/api';
import AdminNav from '../components/AdminNav';

export default function AdminContributions() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/contributions')
      .then(({ data }) => setContributions(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load contributions.'))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    try {
      await api.delete(`/admin/contributions/${id}`);
      setContributions((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t remove that contribution.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Behind the scenes</p>
      <h1 className="mt-2 font-display text-4xl italic">Admin</h1>

      <div className="mt-8">
        <AdminNav />
      </div>

      {loading && <p className="mt-10 text-sm text-warmgray">Loading…</p>}
      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}

      <div className="mt-10 space-y-4">
        {contributions.map((c) => (
          <div key={c._id} className="flex items-start justify-between gap-4 rounded-sm border border-ink/10 p-5">
            <div className="flex gap-4">
              {c.photo?.url && <img src={c.photo.url} alt="" className="h-16 w-16 rounded-sm object-cover" />}
              <div>
                <p className="text-sm text-ink/80">{c.text || <span className="italic text-warmgray">No message</span>}</p>
                <p className="placard mt-2 text-[10px] text-warmgray">
                  {c.contributorName} → “{c.memory?.title || 'a memory'}” ·{' '}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button onClick={() => remove(c._id)} className="shrink-0 text-xs text-red-700 underline underline-offset-4">
              Remove
            </button>
          </div>
        ))}
        {!loading && contributions.length === 0 && <p className="text-sm text-warmgray">No contributions yet.</p>}
      </div>
    </div>
  );
}
