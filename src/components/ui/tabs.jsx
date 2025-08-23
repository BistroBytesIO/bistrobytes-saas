import * as React from "react"
import { cn } from "../../lib/utils"

export const Tabs = ({ defaultValue, children, value, onValueChange, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const current = value ?? internalValue
  const set = onValueChange ?? setInternalValue
  return (
    <div className={cn("w-full", className)} data-value={current}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child, { value: current, onValueChange: set })
      })}
    </div>
  )
}

export const TabsList = ({ children, className }) => (
  <div className={cn("inline-flex items-center rounded-lg bg-muted p-1", className)}>{children}</div>
)

export const TabsTrigger = ({ children, tabValue, value, onValueChange, className }) => {
  const active = value === tabValue
  return (
    <button
      type="button"
      onClick={() => onValueChange(tabValue)}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-md transition-colors",
        active ? "bg-background shadow border" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ children, tabValue, value, className }) => (
  <div className={cn(value === tabValue ? "block" : "hidden", className)}>{children}</div>
)

