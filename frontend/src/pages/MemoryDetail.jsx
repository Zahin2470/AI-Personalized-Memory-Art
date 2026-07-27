import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import FramedArt from '../components/FramedArt';
import Button from '../components/Button';
import Field from '../components/Field';
import { ART_STYLES } from '../lib/constants';

const STYLE_GRADIENTS = {
  watercolor: 'from-blue-100 via-sky-50 to-teal-100',
  minimalist: 'from-stone-100 via-neutral-50 to-stone-200',
  oil_painting: 'from-amber-200 via-orange-100 to-yellow-100',
  pencil_sketch: 'from-neutral-200 via-stone-100 to-neutral-100',
  vintage_poster: 'from-red-200 via-orange-100 to-amber-100',
  pop_art: 'from-fuchsia-200 via-pink-100 to-rose-100',
  abstract_collage: 'from-emerald-100 via-teal-50 to-cyan-100',
};

export default function MemoryDetail() {
  const { id } = useParams();
  const [memory, setMemory] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [unsealing, setUnsealing] = useState(false);
  const [invitingLoading, setInvitingLoading] = useState(false);
  const [revealAt, setRevealAt] = useState('');
  const [generatingStyle, setGeneratingStyle] = useState(null);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    const [memRes, artRes] = await Promise.all([
      api.get(`/memories/${id}`),
      api.get('/artworks', { params: { memoryId: id } }),
    ]);
    setMemory(memRes.data.data);
    setArtworks(artRes.data.data);
    if (memRes.data.data.status !== 'sealed') {
      const contribRes = await api.get(`/memories/${id}/contributions`);
      setContributions(contribRes.data.data);
    }
  }, [id]);

  useEffect(() => {
    // loadAll's setState calls happen inside a promise continuation (after
    // the network round-trip), not synchronously during this effect body -
    // this is the standard fetch-on-mount pattern, not the cascading
    // synchronous re-render the react-hooks/set-state-in-effect rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll()
      .catch((err) => setError(err.response?.data?.message || 'Couldn’t load this memory.'))
      .finally(() => setLoading(false));
  }, [loadAll]);

  const analyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const { data } = await api.post(`/memories/${id}/analyze`);
      setMemory(data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'AI analysis failed. Make sure the AI service is running and XAI_API_KEY is set.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const transcribe = async () => {
    setTranscribing(true);
    setError('');
    try {
      const { data } = await api.post(`/memories/${id}/transcribe`);
      setMemory(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Transcription failed.');
    } finally {
      setTranscribing(false);
    }
  };

  const seal = async () => {
    if (!revealAt) {
      setError('Pick a reveal date first.');
      return;
    }
    setSealing(true);
    setError('');
    try {
      const { data } = await api.put(`/memories/${id}/seal`, { revealAt: new Date(revealAt).toISOString() });
      setMemory(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t seal this memory.');
    } finally {
      setSealing(false);
    }
  };

  const unseal = async () => {
    setUnsealing(true);
    setError('');
    try {
      const { data } = await api.delete(`/memories/${id}/seal`);
      setMemory(data.data);
      const contribRes = await api.get(`/memories/${id}/contributions`);
      setContributions(contribRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t unseal this memory.');
    } finally {
      setUnsealing(false);
    }
  };

  const invite = async () => {
    setInvitingLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/memories/${id}/invite`);
      setMemory((prev) => ({ ...prev, inviteToken: data.data.inviteToken }));
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t create an invite link.');
    } finally {
      setInvitingLoading(false);
    }
  };

  const generateArtwork = async (style) => {
    setGeneratingStyle(style);
    setError('');
    try {
      const { data } = await api.post('/artworks', { memoryId: id, style });
      setArtworks((prev) => [data.data, ...prev]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Artwork generation failed. Make sure the AI service is running and XAI_API_KEY is set.'
      );
    } finally {
      setGeneratingStyle(null);
    }
  };

  if (loading) return <p className="mx-auto max-w-4xl px-6 py-16 text-sm text-warmgray">Loading…</p>;
  if (!memory) return <p className="mx-auto max-w-4xl px-6 py-16 text-sm text-red-700">{error || 'Memory not found.'}</p>;

  // ---------------------------------------------------------- SEALED CAPSULE VIEW
  if (memory.status === 'sealed') {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="placard text-[11px] text-brass-deep">Memory Capsule</p>
        <h1 className="mt-3 font-display text-4xl italic">{memory.title || 'Sealed'}</h1>
        <p className="mt-4 text-sm text-warmgray">
          This one’s sealed until {new Date(memory.capsule.revealAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          . Come back then.
        </p>
        <Button variant="ghost" className="mt-8" onClick={unseal} disabled={unsealing}>
          {unsealing ? 'Opening early…' : 'Open it early anyway'}
        </Button>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  const analysis = memory.aiAnalysis;
  const inviteUrl = memory.inviteToken ? `${window.location.origin}/contribute/${memory.inviteToken}` : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">{memory.status === 'analyzed' ? 'Analyzed' : 'Draft'}</p>
      <h1 className="mt-2 font-display text-4xl italic">{memory.title || 'Untitled memory'}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/80">{memory.description}</p>

      {memory.location && <p className="mt-2 text-sm text-warmgray">{memory.location}</p>}

      {memory.photos?.length > 0 && (
        <div className="mt-6 flex gap-3 overflow-x-auto">
          {memory.photos.map((p, i) => (
            <img key={i} src={p.url} alt="" className="h-32 w-32 rounded-md object-cover" />
          ))}
        </div>
      )}

      {/* ------------------------------------------------------- VOICE NOTE */}
      {memory.voiceNote?.url && (
        <div className="mt-6 max-w-md">
          <audio controls src={memory.voiceNote.url} className="w-full" />
          {memory.voiceNote.transcript ? (
            <p className="mt-2 text-sm italic text-ink/70">“{memory.voiceNote.transcript}”</p>
          ) : (
            <Button variant="ghost" size="sm" className="mt-2" onClick={transcribe} disabled={transcribing}>
              {transcribing ? 'Transcribing…' : 'Transcribe this voice note'}
            </Button>
          )}
        </div>
      )}

      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

      {/* ------------------------------------------------------- COLLABORATORS */}
      <div className="mt-12 border-t border-ink/10 pt-10">
        <p className="placard text-[11px] text-brass-deep">Invite others to add to this memory</p>
        {inviteUrl ? (
          <div className="mt-3 flex items-center gap-3">
            <input
              readOnly
              value={inviteUrl}
              onClick={(e) => e.target.select()}
              className="w-full max-w-md rounded-md border border-ink/15 bg-white px-3 py-2 text-xs text-warmgray"
            />
            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(inviteUrl)}>
              Copy
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="mt-3" onClick={invite} disabled={invitingLoading}>
            {invitingLoading ? 'Creating link…' : 'Create an invite link'}
          </Button>
        )}

        {contributions.length > 0 && (
          <div className="mt-6 space-y-4">
            {contributions.map((c) => (
              <div key={c._id} className="flex gap-4">
                {c.photo?.url && <img src={c.photo.url} alt="" className="h-16 w-16 rounded-sm object-cover" />}
                <div>
                  <p className="text-sm text-ink/80">{c.text}</p>
                  <p className="placard mt-1 text-[10px] text-warmgray">from {c.contributorName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------- SEAL AS CAPSULE */}
      <div className="mt-12 border-t border-ink/10 pt-10">
        <p className="placard text-[11px] text-brass-deep">Memory Capsule</p>
        <p className="mt-2 text-sm text-warmgray">Seal this memory to reopen on a future date — an anniversary, a birthday, whenever.</p>
        <div className="mt-3 flex items-center gap-3">
          <Field label="Reveal on" type="date" value={revealAt} onChange={(e) => setRevealAt(e.target.value)} className="w-auto" />
          <Button variant="ghost" size="sm" onClick={seal} disabled={sealing} className="mt-6">
            {sealing ? 'Sealing…' : 'Seal it'}
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------- AI ANALYSIS */}
      <div className="mt-12 border-t border-ink/10 pt-10">
        <p className="placard text-[11px] text-brass-deep">Accn. 02 — Interpret</p>
        {!analysis ? (
          <div className="mt-4">
            <p className="text-sm text-warmgray">Not analyzed yet — this reads the mood and drafts a story and titles.</p>
            <Button onClick={analyze} variant="primary" className="mt-4" disabled={analyzing}>
              {analyzing ? 'Reading the memory…' : 'Run AI analysis'}
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-4">
              <span className="placard rounded-full border border-ink/15 px-4 py-2 text-[11px]">
                Mood: {analysis.emotion}
              </span>
              <div className="flex gap-1.5">
                {analysis.colorPalette?.map((hex) => (
                  <span key={hex} className="h-6 w-6 rounded-full border border-ink/10" style={{ backgroundColor: hex }} title={hex} />
                ))}
              </div>
            </div>

            {analysis.story && <p className="font-display text-xl italic leading-snug text-ink/90">“{analysis.story}”</p>}

            {analysis.suggestedTitles?.length > 0 && (
              <div>
                <p className="placard text-[10px] text-warmgray">Suggested titles</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysis.suggestedTitles.map((t) => (
                    <span key={t} className="rounded-full bg-parchment-dim px-3 py-1 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {analysis.tags.map((t) => (
                  <span key={t} className="placard text-[10px] text-warmgray">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------- STYLE PICKER */}
      <div className="mt-12 border-t border-ink/10 pt-10">
        <p className="placard text-[11px] text-brass-deep">Accn. 03 — Choose a medium</p>
        <p className="mt-2 text-sm text-warmgray">Pick a style to generate a piece from this memory. You can make more than one.</p>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {ART_STYLES.map((style, i) => (
            <FramedArt
              key={style.id}
              title={style.label}
              medium={generatingStyle === style.id ? 'Generating…' : style.blurb}
              gradient={STYLE_GRADIENTS[style.id]}
              interactive
              index={i}
              float={generatingStyle !== style.id}
              onClick={() => generateArtwork(style.id)}
              className={generatingStyle === style.id ? 'pointer-events-none opacity-70' : ''}
            />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------- ARTWORK GALLERY */}
      {artworks.length > 0 && (
        <div className="mt-12 border-t border-ink/10 pt-10">
          <p className="placard text-[11px] text-brass-deep">Your pieces from this memory</p>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3">
            {artworks.map((a, i) => (
              <div key={a._id}>
                <FramedArt
                  title={a.title || memory.title}
                  medium={a.style.replace('_', ' ')}
                  imageUrl={a.imageUrl}
                  gradient={STYLE_GRADIENTS[a.style]}
                  index={i}
                />
                <Link
                  to={`/artworks/${a._id}/product`}
                  className="mt-2 inline-block text-xs text-warmgray underline underline-offset-4"
                >
                  Make a product from this
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
