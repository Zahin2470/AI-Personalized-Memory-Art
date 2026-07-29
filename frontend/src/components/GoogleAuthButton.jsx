import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function GoogleAuthButton({ onError }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  // GoogleLogin requires a GoogleOAuthProvider ancestor, which main.jsx only
  // renders when VITE_GOOGLE_CLIENT_ID is set - rendering it without that
  // context throws, so this needs to bail out before that happens too.
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <div className="flex justify-center">
        <GoogleLogin
          theme="filled_black"
          shape="pill"
          text="continue_with"
          width="320"
          onSuccess={async (response) => {
            try {
              await googleLogin(response.credential);
              navigate('/dashboard');
            } catch (err) {
              onError?.(err.response?.data?.message || 'Google sign-in failed. Try again.');
            }
          }}
          onError={() => onError?.('Google sign-in failed. Try again.')}
        />
      </div>
      <div className="mt-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-ink/10" />
        <span className="placard text-[10px] text-warmgray">or</span>
        <div className="h-px flex-1 bg-ink/10" />
      </div>
    </>
  );
}
