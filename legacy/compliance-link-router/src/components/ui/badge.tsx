import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-grotesk transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        // Aegis glow variants
        'glow-purple':
          'border-[rgba(124,58,237,0.4)] bg-[rgba(124,58,237,0.15)] text-violet-300 shadow-[0_0_12px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]',
        'glow-cyan':
          'border-[rgba(6,182,212,0.4)] bg-[rgba(6,182,212,0.15)] text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]',
        'glow-green':
          'border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.15)] text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]',
        'glow-red':
          'border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.15)] text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]',
        'glow-amber':
          'border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.15)] text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]',
        'glow-pink':
          'border-[rgba(236,72,153,0.4)] bg-[rgba(236,72,153,0.15)] text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)] hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]',
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
