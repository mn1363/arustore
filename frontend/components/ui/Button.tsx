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
      primary: 'champagne-btn font-bold',
      accent:
        'bg-[#d6b88a]/15 text-[#ead7b7] border border-[#d6b88a]/35 hover:bg-[#d6b88a] hover:text-[#111215] font-semibold',
      neon: 'champagne-btn font-bold',
      secondary:
        'bg-white/[0.06] text-[#f2f2f0] border border-white/[0.08] hover:bg-white/[0.1]',
      outline:
        'border border-white/15 text-[#d4d6dc] hover:border-white/30 hover:text-white bg-transparent',
      ghost: 'text-[#b4b8c2] hover:bg-white/[0.06] hover:text-white',
    }

    const sizes = {
      sm: 'px-3.5 py-2 text-xs rounded-xl gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
