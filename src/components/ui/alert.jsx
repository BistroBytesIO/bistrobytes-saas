import * as React from "react"
import { cn } from "../../lib/utils"

const Alert = ({ className, variant = "default", children, ...props }) => {
  const variants = {
    default: "bg-muted text-muted-foreground border",
    info: "bg-blue-50 text-blue-900 border border-blue-200",
    success: "bg-green-50 text-green-900 border border-green-200",
    warning: "bg-yellow-50 text-yellow-900 border border-yellow-200",
    destructive: "bg-red-50 text-red-900 border border-red-200",
  }
  return (
    <div className={cn("rounded-lg p-4", variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

const AlertTitle = ({ className, ...props }) => (
  <div className={cn("mb-1 font-medium", className)} {...props} />
)

const AlertDescription = ({ className, ...props }) => (
  <div className={cn("text-sm opacity-90", className)} {...props} />
)

export { Alert, AlertTitle, AlertDescription }

