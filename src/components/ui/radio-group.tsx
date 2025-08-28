/**
 * RadioGroup 컴포넌트
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const RadioGroupContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
} | null>(null)

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, disabled, children, className, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
        <div ref={ref} className={cn('grid gap-2', className)} role='radiogroup' {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = 'RadioGroup'

interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ value, id, className, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    if (!context) {
      throw new Error('RadioGroupItem must be used within RadioGroup')
    }

    const isChecked = context.value === value
    const isDisabled = context.disabled

    return (
      <button
        ref={ref}
        type='button'
        role='radio'
        aria-checked={isChecked}
        id={id}
        onClick={() => !isDisabled && context.onValueChange(value)}
        disabled={isDisabled}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-gray-200 text-gray-900 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          isChecked && 'border-gray-900',
          className
        )}
        {...props}
      >
        {isChecked && (
          <div className='flex items-center justify-center'>
            <div className='h-2.5 w-2.5 rounded-full bg-gray-900' />
          </div>
        )}
      </button>
    )
  }
)
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
