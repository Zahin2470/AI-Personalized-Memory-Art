import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Field from '../components/Field';
import Button from '../components/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      // The endpoint itself never reveals whether an email exists - this
      // only fires for genuine failures (rate limited, malformed request).
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16 text-center">
        <p className="placard text-[11px] text-brass-deep">Check your inbox</p>
        <h1 className="mt-3 font-display text-4xl italic">Reset link sent.</h1>
        <p className="mt-4 text-sm text-warmgray">
          If an account exists for {email}, a reset link is on its way. It expires in 30 minutes.
        </p>
        <Link to="/login" className="mt-8 text-sm text-ink underline underline-offset-4">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="placard text-[11px] text-brass-deep">Locked out?</p>
      <h1 className="mt-3 font-display text-4xl italic">Reset your password</h1>
      <p className="mt-3 text-sm text-warmgray">Enter your email and we’ll send a link to set a new one.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <Field
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <Link to="/login" className="mt-8 inline-block text-sm text-warmgray underline underline-offset-4">
        Back to log in
      </Link>
    </div>
  );
}
