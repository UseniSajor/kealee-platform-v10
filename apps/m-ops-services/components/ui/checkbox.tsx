import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-orange-600 checked:border-orange-600",
            className
          )}
          ref={ref}
          {...props}
        />
        <Check className="absolute h-3 w-3 text-white pointer-events-none hidden peer-checked:block left-0.5" />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
