import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Button from './Button';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brass-deep" aria-hidden="true" />
          <span className="font-display text-2xl italic">Memory Art</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/#how-it-works" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
            How it works
          </Link>
          <Link to="/#styles" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
            Styles
          </Link>
          <Link to="/#collection" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
            Collection
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
                My memories
              </Link>
              <Link to="/timeline" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
                Timeline
              </Link>
              <Link to="/constellation" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
                Constellation
              </Link>
              <Link to="/favorites" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
                Favorites
              </Link>
              <Link to="/cart" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
                Cart
              </Link>
              <Link to="/orders" className="link-underline placard text-[11px] text-ink/70 hover:text-ink">
                Orders
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="link-underline placard text-[11px] text-brass-deep hover:text-ink">
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <span className="hidden font-body text-sm text-warmgray sm:inline">Hi, {user?.name?.split(' ')[0]}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button as={Link} to="/register" variant="brass" size="sm">
                Start a piece
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
