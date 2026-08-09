import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Field from '../components/Field';
import Button from '../components/Button';
import GoogleAuthButton from '../components/GoogleAuthButton';
import Seo from '../components/Seo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t log in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <Seo title="Log in" description="Log in to Memory Art to keep making pieces from your memories." />
      <p className="placard text-[11px] text-brass-deep">Welcome back</p>
      <h1 className="mt-3 font-display text-4xl italic">Log in</h1>

      <div className="mt-8">
        <GoogleAuthButton onError={setError} />
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <Field
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
        />
        <div>
          <Field
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
          <Link to="/forgot-password" className="mt-2 inline-block text-xs text-warmgray underline underline-offset-4">
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-warmgray">
        New here?{' '}
        <Link to="/register" className="text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
