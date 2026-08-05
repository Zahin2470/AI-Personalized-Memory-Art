const VARIANTS = {
  primary: 'bg-ink-fixed text-parchment-fixed hover:bg-ink-soft hover:shadow-lg',
  brass: 'bg-brass text-ink hover:bg-brass-bright hover:shadow-lg',
  outline: 'border border-ink/20 text-ink hover:border-ink/50 bg-transparent',
  ghost: 'text-ink hover:bg-ink/5',
};

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:duration-75 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none ${VARIANTS[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
