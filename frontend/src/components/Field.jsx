export default function Field({ label, as: Tag = 'input', className = '', ...props }) {
  return (
    <label className="block">
      <span className="placard text-[10px] text-warmgray">{label}</span>
      <Tag
        className={`mt-2 block w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-warmgray-dim transition-shadow duration-200 focus:border-brass-deep focus:shadow-[0_0_0_3px_rgba(201,161,93,0.15)] focus:outline-none dark:border-parchment-line/20 dark:bg-ink-soft dark:text-parchment ${className}`}
        {...props}
      />
    </label>
  );
}
