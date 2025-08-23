import * as React from "react"
import { cn } from "../../lib/utils"

export const Accordion = ({ children, className }) => (
  <div className={cn("space-y-2", className)}>{children}</div>
)

export const AccordionItem = ({ value, className, children }) => (
  <div className={cn("border rounded-lg", className)} data-value={value}>{children}</div>
)

export const AccordionTrigger = ({ className, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full text-left px-4 py-3 font-medium flex items-center justify-between hover:bg-accent rounded-lg",
      className
    )}
  >
    {children}
  </button>
)

export const AccordionContent = ({ className, children, open }) => (
  <div className={cn("px-4 pb-4", open ? "block" : "hidden", className)}>{children}</div>
)

