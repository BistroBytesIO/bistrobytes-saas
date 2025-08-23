import * as React from "react"
import { cn } from "../../lib/utils"

const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = "Select"

export { Select }

