import { useEffect, useRef, useState } from 'react';

/**
 * Wraps any content so it stays hidden/offset until it scrolls into view,
 * then reveals once (doesn't re-hide on scrolling back past it - reveals
 * read as "arriving," not as a toggle). Respects prefers-reduced-motion by
 * just rendering visible immediately - IntersectionObserver still fires,
 * but the CSS transition duration is zeroed globally (see index.css), so
 * skipping the observer entirely for that case avoids any pointless work.
 *
 * `as` lets the wrapper element match its context (e.g. "div" for a
 * section, "li" inside a list) so this never introduces invalid nesting.
 */
export default function Reveal({ children, as: Tag = 'div', delay = 0, className = '' }) {
  const ref = useRef(null);
  // Reduced-motion case is decided once, up front, via the initializer -
  // not inside the effect - so the effect body itself never calls setState
  // synchronously; it only ever does so from the async observer callback
  // below, same as the fetch-driven patterns elsewhere in this app.
  const [visible, setVisible] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // already visible via the initializer above

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // once - a reveal is an arrival, not a toggle
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`scroll-reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}
