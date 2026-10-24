import React, { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export default function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-slate-300">{label}</label>}
      <select
        className={cn(
          'rounded-xl bg-obsidian-800 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/70 transition-colors',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-obsidian-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
