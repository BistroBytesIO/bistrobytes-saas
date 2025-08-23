import * as React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "text-foreground border border-border",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-500 text-black",
    destructive: "bg-destructive text-destructive-foreground",
  }

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }

