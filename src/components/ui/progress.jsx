import * as React from "react"
import { cn } from "../../lib/utils"

const Progress = React.forwardRef(({ className, value, max = 100, ...props }, ref) => {
  const percent = Math.max(0, Math.min(100, Number(value ?? 0)))
  return (
    <div ref={ref} className={cn("w-full h-2 bg-muted rounded-full overflow-hidden", className)} {...props}>
      <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
    </div>
  )}
)
Progress.displayName = "Progress"

export { Progress }

