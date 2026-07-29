import { useEffect, useState } from 'react';
import api from '../lib/api';
import AdminNav from '../components/AdminNav';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/users')
      .then(({ data }) => setUsers(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load users.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Behind the scenes</p>
      <h1 className="mt-2 font-display text-4xl italic">Admin</h1>

      <div className="mt-8">
        <AdminNav />
      </div>

      {loading && <p className="mt-10 text-sm text-warmgray">Loading users…</p>}
      {error && <p className="mt-10 text-sm text-red-700">{error}</p>}

      {!loading && !error && (
        <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-body text-sm font-medium">{u.name}</p>
                <p className="text-xs text-warmgray">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="placard text-[10px] text-warmgray">{u.authProvider}</span>
                {u.role === 'admin' && (
                  <span className="placard rounded-full bg-brass/20 px-3 py-1 text-[10px] text-brass-deep">
                    Admin
                  </span>
                )}
                <span className="placard text-[10px] text-warmgray">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
