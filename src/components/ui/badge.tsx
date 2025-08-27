import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-chip-light text-text-700 hover:bg-brand-100',
        secondary: 'border-transparent bg-stroke-200 text-text-700 hover:bg-stroke-200/80',
        destructive: 'border-transparent bg-red-100 text-red-700 hover:bg-red-200',
        success: 'border-transparent bg-green-100 text-green-700 hover:bg-green-200',
        warning: 'border-transparent bg-orange-100 text-orange-700 hover:bg-orange-200',
        outline: 'border-stroke-200 text-text-700 hover:bg-brand-50',
        brand: 'border-transparent bg-brand-600 text-white hover:bg-brand-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
