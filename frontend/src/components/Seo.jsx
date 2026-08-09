import { useEffect } from 'react';

const SITE_NAME = 'Memory Art';
const DEFAULT_DESCRIPTION =
  'Upload a memory — photos, a voice note, a date — and Memory Art turns it into a one-of-one illustrated piece, ready to hang, gift, or keep.';

const setMeta = (name, content, attr = 'name') => {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

/**
 * Drop this in any page to set its browser-tab title and meta description.
 * Falls back to the site default description when one isn't given. Restores
 * the previous title on unmount so navigating away (e.g. via the back
 * button interrupting a fetch) doesn't leave a stale title behind.
 *
 *   <Seo title="My memories" description="Browse everything you've made." />
 */
export default function Seo({ title, description = DEFAULT_DESCRIPTION }) {
  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Turn moments into gallery-worthy art`;

    document.title = fullTitle;
    setMeta('description', description);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);

  return null;
}
