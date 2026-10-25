import React, { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-[#b4bccf]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-[#0a0c14] border border-white/[0.1] px-4 py-2.5 text-sm text-[#f4f4f6] placeholder:text-[#666e82] shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)] focus:outline-none focus:border-[#dfc08e]/65 focus:ring-2 focus:ring-[#dfc08e]/15 transition-all',
            error && 'border-rose-500/70',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
