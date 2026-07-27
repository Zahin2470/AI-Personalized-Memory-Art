import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import Field from '../components/Field';
import Button from '../components/Button';

export default function Contribute() {
  const { token } = useParams();
  const [memoryTitle, setMemoryTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/contribute/${token}`)
      .then(({ data }) => setMemoryTitle(data.data.title))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!contributorName.trim()) {
      setError('Your name is needed so they know who this is from.');
      return;
    }
    if (!text.trim() && !photo) {
      setError('Add a message or a photo (or both).');
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('contributorName', contributorName);
      body.append('text', text);
      if (photo) body.append('photo', photo);
      await api.post(`/contribute/${token}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t send that. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="mx-auto max-w-lg px-6 py-24 text-center text-sm text-warmgray">Loading…</p>;

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="placard text-[11px] text-brass-deep">Invite not found</p>
        <h1 className="mt-3 font-display text-3xl italic">This link isn’t valid.</h1>
        <p className="mt-3 text-sm text-warmgray">It may have been reset by whoever shared it with you.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="placard text-[11px] text-brass-deep">Added</p>
        <h1 className="mt-3 font-display text-3xl italic">Thank you.</h1>
        <p className="mt-3 text-sm text-warmgray">Your piece of this memory has been added.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <p className="placard text-[11px] text-brass-deep">You’ve been invited to add to</p>
      <h1 className="mt-2 font-display text-4xl italic">{memoryTitle}</h1>
      <p className="mt-3 text-sm text-warmgray">Add a photo, a memory of your own, or just a note.</p>

      <form onSubmit={submit} className="mt-10 space-y-5">
        <Field label="Your name" required value={contributorName} onChange={(e) => setContributorName(e.target.value)} />
        <Field
          label="Message (optional)"
          as="textarea"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add what you remember…"
        />
        <Field
          label="Photo (optional)"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setPhoto(e.target.files[0] || null)}
          className="cursor-pointer file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:text-parchment"
        />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Sending…' : 'Add to this memory'}
        </Button>
      </form>
    </div>
  );
}
