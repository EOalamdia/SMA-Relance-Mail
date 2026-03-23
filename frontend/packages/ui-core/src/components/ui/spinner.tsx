import { cn } from "../../lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  fullPage?: boolean
  label?: string
}

export function Spinner({ size = "md", fullPage = false, label, className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const content = (
    <div className={cn("flex flex-col items-center gap-2", className)} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("animate-spin", sizeClasses[size])}
      >
        <defs>
          <linearGradient id="spinner-message-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="url(#spinner-message-gradient)" />
      </svg>
      {label && (
        <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-pulse">
          {label}
        </span>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-background/50 to-primary/5 backdrop-blur-md z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
