import { useLocation } from 'react-router-dom';

/**
 * Wraps routed page content so every navigation gets a soft fade+rise
 * instead of an instant snap. Keying on the pathname forces React to treat
 * each route as a fresh element, which replays the CSS animation - no
 * external animation library needed for this "enter only" style of
 * transition (there's no exit animation; the old page just unmounts,
 * which reads fine at this animation's speed and duration).
 */
export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-page-fade-in">
      {children}
    </div>
  );
}
