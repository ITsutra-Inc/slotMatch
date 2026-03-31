interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export default function Badge({
  variant = "default",
  children,
  className = "",
  dot = false,
}: BadgeProps) {
  const variants = {
    default: "bg-surface text-muted dark:bg-white/[0.06] dark:text-foreground",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    info: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  };

  const dotColors = {
    default: "bg-muted",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-indigo-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
