export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-parchment">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl italic">Memory Art</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-parchment/70">
              A small, AI-assisted studio that turns a photo, a voice note, or a date you
              haven’t forgotten into a piece worth hanging.
            </p>
          </div>

          <div>
            <p className="placard text-[11px] text-brass-bright">Collection</p>
            <ul className="mt-4 space-y-2 text-sm text-parchment/70">
              <li>Watercolor</li>
              <li>Oil Painting</li>
              <li>Vintage Poster</li>
              <li>Pencil Sketch</li>
            </ul>
          </div>

          <div>
            <p className="placard text-[11px] text-brass-bright">Occasions</p>
            <ul className="mt-4 space-y-2 text-sm text-parchment/70">
              <li>Anniversaries</li>
              <li>Baby milestones</li>
              <li>Pet memorials</li>
              <li>Travel keepsakes</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-parchment/10 pt-8 text-xs text-parchment/50 sm:flex-row sm:items-center">
          <p className="placard">Memory Art Studio · Est. 2026</p>
          <p>Every piece is generated from what you share — nothing is used without your upload.</p>
        </div>
      </div>
    </footer>
  );
}
