import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'link'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: "bg-[#E86A33] text-white hover:bg-[#C85A28] shadow-sm hover:shadow-md",
      outline: "border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-900 hover:border-[#E86A33] hover:text-[#E86A33]",
      ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
      secondary: "bg-slate-900 text-white hover:bg-slate-800",
      link: "text-[#E86A33] underline-offset-4 hover:underline p-0 h-auto"
    }

    const sizes = {
      sm: "h-8 px-3 text-sm rounded-md",
      md: "h-10 px-4 text-sm rounded-lg",
      lg: "h-12 px-6 text-base rounded-lg font-semibold"
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A33] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
