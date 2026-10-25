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
      accent: 'secondary-3d-btn text-[#ead7b7] font-semibold',
      neon: 'champagne-btn font-bold',
      secondary: 'secondary-3d-btn font-medium',
      outline:
        'border border-white/15 text-[#d4d6dc] hover:border-[#dfc08e]/45 hover:text-white bg-white/[0.02]',
      ghost: 'text-[#b4bccf] hover:bg-white/[0.06] hover:text-white',
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
          'inline-flex items-center justify-center select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
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
