'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const labelVariants = cva(
  'text-sm font-medium font-grotesk leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'text-[rgba(255,255,255,0.8)]',
        muted:   'text-[rgba(255,255,255,0.5)]',
        glow:    'text-violet-300 drop-shadow-[0_0_6px_rgba(124,58,237,0.6)]',
        cyan:    'text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
