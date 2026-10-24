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
      primary:
        'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-extrabold hover:brightness-110 shadow-neon-cyan',
      accent:
        'bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-400 hover:text-slate-950 font-semibold',
      neon:
        'bg-slate-200/15 text-slate-100 border border-slate-200/35 hover:bg-slate-200 hover:text-slate-950 shadow-neon-violet',
      secondary:
        'bg-white/10 text-white border border-white/10 hover:bg-white/15',
      outline:
        'border border-white/20 text-slate-200 hover:border-amber-400/60 hover:text-amber-300 bg-white/[0.02]',
      ghost:
        'text-slate-300 hover:bg-white/10 hover:text-white',
    }

    const sizes = {
      sm: 'px-3.5 py-2 text-xs rounded-xl gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
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
