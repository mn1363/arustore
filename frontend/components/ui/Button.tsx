import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'neon'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const variants = {
      primary: 'satin-brass-btn font-bold hover:brightness-105',
      accent:
        'bg-[#c59b5f]/15 text-[#dfc08e] border border-[#c59b5f]/45 hover:bg-[#c59b5f] hover:text-[#11100e] font-semibold',
      neon: 'brushed-metal-btn font-bold',
      secondary:
        'bg-[#1c1915] text-[#f3efe8] border border-[#ece6dc]/15 hover:border-[#c59b5f]/50',
      outline:
        'border border-[#ece6dc]/22 text-[#d6cfc4] hover:border-[#c59b5f] hover:text-[#f7f4ee] bg-transparent',
      ghost: 'text-[#bfb6a8] hover:bg-[#ece6dc]/8 hover:text-[#f7f4ee]',
    }

    const sizes = {
      sm: 'px-3.5 py-2 text-xs rounded-[2px] gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-[2px] gap-2',
      lg: 'px-7 py-3.5 text-base rounded-[3px] gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#c59b5f] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
