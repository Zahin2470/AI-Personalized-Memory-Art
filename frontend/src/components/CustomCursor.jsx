import { useEffect, useRef, useState } from 'react';

/**
 * A subtle brass ring that trails the real cursor with a slight lag, and
 * grows a little when hovering anything clickable. Purely decorative -
 * pointer-events-none throughout, native cursor stays fully visible and
 * functional (this sits alongside it, never replaces it). Skips itself
 * entirely on touch/coarse-pointer devices (there's no hover to track) and
 * when the user prefers reduced motion.
 */
export default function CustomCursor() {
  const ringRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  // Both checks are synchronous (no async system to subscribe to first), so
  // there's no reason to compute this inside an effect - a lazy initializer
  // decides it once, up front, same fix as applied elsewhere in this app
  // (Reveal.jsx, CheckoutCancel.jsx) for this exact category of issue.
  const [enabled] = useState(() => {
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return supportsHover && !reducedMotion;
  });
  const [hoveringInteractive, setHoveringInteractive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let frame;

    const onMouseMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const onMouseOver = (e) => {
      setHoveringInteractive(Boolean(e.target.closest('a, button, input, textarea, select, [role="button"]')));
    };

    const onMouseLeaveWindow = () => setVisible(false);

    // requestAnimationFrame loop lerps toward the real cursor position for
    // a smooth trailing feel, rather than snapping the ring 1:1 with the
    // mouse (which would defeat the point of a "trailing" accent).
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.2;
      pos.current.y += (target.current.y - pos.current.y) * 0.2;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(tick);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseleave', onMouseLeaveWindow);
    frame = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseleave', onMouseLeaveWindow);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `visible` is only read to avoid a redundant setState call; including it would tear down and restart the rAF loop on every visibility change, which is exactly what this guard is meant to prevent.
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[90] rounded-full border transition-[width,height,opacity,border-color] duration-200 ease-out ${
        hoveringInteractive ? 'h-9 w-9 border-brass' : 'h-5 w-5 border-brass/70'
      } ${visible ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
