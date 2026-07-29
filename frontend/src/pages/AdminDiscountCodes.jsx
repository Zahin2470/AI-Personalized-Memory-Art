import { useEffect, useState } from 'react';
import api from '../lib/api';
import AdminNav from '../components/AdminNav';
import Field from '../components/Field';
import Button from '../components/Button';

export default function AdminDiscountCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', maxUses: '', expiresAt: '' });

  const load = () =>
    api
      .get('/admin/discount-codes')
      .then(({ data }) => setCodes(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load discount codes.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const createCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.code || !form.value) {
      setError('Code and value are required.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/admin/discount-codes', {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setForm({ code: '', type: 'percent', value: '', maxUses: '', expiresAt: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t create that code.');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (code) => {
    try {
      const { data } = await api.put(`/admin/discount-codes/${code._id}`, { active: !code.active });
      setCodes((prev) => prev.map((c) => (c._id === code._id ? data.data : c)));
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t update that code.');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/discount-codes/${id}`);
      setCodes((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t delete that code.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Behind the scenes</p>
      <h1 className="mt-2 font-display text-4xl italic">Admin</h1>

      <div className="mt-8">
        <AdminNav />
      </div>

      <form onSubmit={createCode} className="mt-10 grid gap-4 rounded-sm border border-ink/10 p-6 sm:grid-cols-5">
        <Field
          label="Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="WELCOME10"
        />
        <label className="block">
          <span className="placard text-[10px] text-warmgray">Type</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-2 block w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-sm"
          >
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </label>
        <Field
          label={form.type === 'percent' ? 'Value (%)' : 'Value (৳)'}
          type="number"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          placeholder={form.type === 'percent' ? '10' : '500'}
        />
        <Field
          label="Max uses (optional)"
          type="number"
          value={form.maxUses}
          onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          placeholder="Unlimited"
        />
        <div className="flex items-end">
          <Button type="submit" variant="brass" className="w-full" disabled={creating}>
            {creating ? 'Creating…' : 'Create code'}
          </Button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-10 text-sm text-warmgray">Loading codes…</p>}

      <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
        {codes.map((code) => (
          <div key={code._id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-body text-sm font-medium">{code.code}</p>
              <p className="text-xs text-warmgray">
                {code.type === 'percent' ? `${code.value}% off` : `৳${code.value / 100} off`}
                {' · '}
                {code.usedCount} used{code.maxUses ? ` / ${code.maxUses}` : ''}
                {code.expiresAt ? ` · expires ${new Date(code.expiresAt).toLocaleDateString()}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleActive(code)}
                className={`placard rounded-full px-3 py-1 text-[10px] ${
                  code.active ? 'bg-emerald/20 text-emerald-deep' : 'bg-ink/10 text-warmgray'
                }`}
              >
                {code.active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => remove(code._id)} className="text-xs text-warmgray underline underline-offset-4">
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && codes.length === 0 && <p className="py-4 text-sm text-warmgray">No discount codes yet.</p>}
      </div>
    </div>
  );
}
