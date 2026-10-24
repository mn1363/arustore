import React, { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export default function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-[#b4b8c2]">{label}</label>}
      <select
        className={cn(
          'rounded-xl bg-[#0d0e11] border border-white/10 px-3.5 py-2.5 text-sm text-[#f2f2f0] focus:outline-none focus:border-white/25 transition-colors',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#14161a] text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
