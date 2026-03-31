interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  padding = true,
  hover = false,
}: CardProps) {
  return (
    <div
      className={`bg-card rounded-xl border border-border/60 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.04] ${padding ? "p-6" : ""} ${hover ? "card-hover" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-semibold text-foreground ${className}`}>
      {children}
    </h3>
  );
}
