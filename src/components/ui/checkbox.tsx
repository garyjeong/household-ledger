import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, checked, ...props }, ref) => {
    const generatedId = React.useId()
    const checkboxId = id || generatedId

    return (
      <div className='flex items-center space-x-2'>
        <div className='relative'>
          <input
            type='checkbox'
            id={checkboxId}
            ref={ref}
            checked={checked}
            className={cn(
              'peer h-4 w-4 shrink-0 rounded border border-slate-300 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              'checked:bg-slate-900 checked:border-slate-900',
              className
            )}
            {...props}
          />
          <Check className='absolute left-0.5 top-0.5 h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none' />
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className='text-sm font-medium text-slate-900 cursor-pointer select-none'
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
