import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

const POLL_INTERVAL_MS = 30_000;

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(() => {
    if (!isAuthenticated) return;
    api
      .get('/notifications')
      .then(({ data }) => {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {}); // silent - a failed poll shouldn't surface an error to the whole page
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, load]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openNotification = async (n) => {
    setOpen(false);
    if (!n.read) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // non-critical - still navigate even if marking read failed
      }
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // non-critical
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brass-deep text-[9px] font-medium text-parchment-fixed">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-sm border border-ink/10 bg-white shadow-lg dark:border-parchment-line/20 dark:bg-ink-soft">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <p className="placard text-[10px] text-warmgray">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-warmgray underline underline-offset-4">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-warmgray">Nothing yet.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => openNotification(n)}
                className={`block w-full border-b border-ink/5 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-parchment-dim ${
                  n.read ? 'text-warmgray' : 'text-ink'
                }`}
              >
                <span className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-deep" />}
                  <span className={n.read ? '' : 'flex-1'}>{n.message}</span>
                </span>
                <span className="placard mt-1 block text-[9px] text-warmgray">{timeAgo(n.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
