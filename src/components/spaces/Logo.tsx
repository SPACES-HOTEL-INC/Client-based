export function ArchMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="Spaces logo">
      <rect width="512" height="512" rx="112" fill="#0A0F1D" />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M 136 368 L 136 248 C 136 181.7 189.7 128 256 128 C 322.3 128 376 181.7 376 248 L 376 368 L 304 368 L 304 248 C 304 221.5 282.5 200 256 200 C 229.5 200 208 221.5 208 248 L 208 368 Z"
      />
      <circle cx="256" cy="132" r="30" fill="#60C3AD" />
    </svg>
  );
}

export function SpacesLogo({
  size = "md",
  onDark = true,
}: {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const mark = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const text = size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl";
  return (
    <div className="flex items-center gap-3">
      <ArchMark className={mark} />
      <span
        className={`${text} font-display font-semibold tracking-tight ${onDark ? "text-white" : "text-foreground"}`}
      >
        Spaces
      </span>
    </div>
  );
}
