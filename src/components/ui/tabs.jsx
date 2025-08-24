import * as React from "react"
import { cn } from "../../lib/utils"

const TabsContext = React.createContext()

export const Tabs = ({ defaultValue, children, value, onValueChange, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const current = value ?? internalValue
  const setValue = onValueChange ?? setInternalValue
  
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: setValue }}>
      <div className={cn("w-full", className)} data-value={current}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export const TabsList = ({ children, className }) => (
  <div className={cn("inline-flex items-center rounded-lg bg-muted p-1", className)}>{children}</div>
)

export const TabsTrigger = ({ children, tabValue, className }) => {
  const context = React.useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }
  
  const { value, onValueChange } = context
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

export const TabsContent = ({ children, tabValue, className }) => {
  const context = React.useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }
  
  const { value } = context
  
  return (
    <div className={cn(value === tabValue ? "block" : "hidden", className)}>
      {children}
    </div>
  )
}

