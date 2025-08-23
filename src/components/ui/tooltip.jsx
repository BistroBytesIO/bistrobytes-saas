import * as React from "react"
import { cn } from "../../lib/utils"

const Tooltip = ({ content, children, className }) => (
  <span className={cn("relative inline-flex items-center group", className)}>
    {children}
    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow group-hover:block">
      {content}
    </span>
  </span>
)

export { Tooltip }

