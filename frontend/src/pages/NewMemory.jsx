import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Field from '../components/Field';
import Button from '../components/Button';

const emptyDate = () => ({ label: '', date: '' });

export default function NewMemory() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', location: '' });
  const [dates, setDates] = useState([emptyDate()]);
  const [photos, setPhotos] = useState([]);
  const [voiceNote, setVoiceNote] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateDate = (i, field, value) => {
    setDates((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.description.trim()) {
      setError('Tell us a little about the memory first.');
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('description', form.description);
      body.append('location', form.location);
      body.append(
        'dates',
        JSON.stringify(dates.filter((d) => d.date).map((d) => ({ label: d.label, date: d.date })))
      );
      photos.forEach((file) => body.append('photos', file));
      if (voiceNote) body.append('voiceNote', voiceNote);

      const { data } = await api.post('/memories', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/memories/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t save this memory. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Accn. 01 — Share</p>
      <h1 className="mt-2 font-display text-4xl italic">Tell us what happened.</h1>
      <p className="mt-3 text-sm text-warmgray">
        A description is all that’s required. Photos, a voice note, and dates sharpen the
        result but aren’t necessary to start.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <Field
          label="Title (optional — we’ll suggest one if you skip it)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="First Trip, 2019"
        />

        <Field
          label="What happened?"
          as="textarea"
          rows={5}
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Our first trip together in Cox’s Bazar during sunset…"
        />

        <Field
          label="Location (optional)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Cox’s Bazar, Bangladesh"
        />

        <div>
          <span className="placard text-[10px] text-warmgray">Dates (optional)</span>
          <div className="mt-2 space-y-3">
            {dates.map((d, i) => (
              <div key={i} className="flex gap-3">
                <input
                  className="w-1/2 rounded-md border border-ink/15 bg-white px-4 py-3 text-sm focus:border-brass-deep focus:outline-none"
                  placeholder="Label, e.g. First Trip"
                  value={d.label}
                  onChange={(e) => updateDate(i, 'label', e.target.value)}
                />
                <input
                  type="date"
                  className="w-1/2 rounded-md border border-ink/15 bg-white px-4 py-3 text-sm focus:border-brass-deep focus:outline-none"
                  value={d.date}
                  onChange={(e) => updateDate(i, 'date', e.target.value)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDates((prev) => [...prev, emptyDate()])}
            className="mt-2 text-xs text-warmgray underline underline-offset-4"
          >
            + Add another date
          </button>
        </div>

        <Field
          label="Photos (optional, up to 10)"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files))}
          className="cursor-pointer file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:text-parchment"
        />

        <Field
          label="Voice note (optional)"
          type="file"
          accept="audio/mpeg,audio/wav,audio/mp4"
          onChange={(e) => setVoiceNote(e.target.files[0] || null)}
          className="cursor-pointer file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:text-parchment"
        />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Save memory'}
        </Button>
      </form>
    </div>
  );
}
