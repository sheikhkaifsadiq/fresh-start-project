'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  color?: 'purple' | 'cyan' | 'green' | 'red' | 'amber' | 'gradient'
  showShimmer?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, color = 'purple', showShimmer = true, ...props }, ref) => {
  const colorClasses: Record<string, string> = {
    purple:   'bg-[rgba(124,58,237,0.9)] shadow-[0_0_12px_rgba(124,58,237,0.6)]',
    cyan:     'bg-[rgba(6,182,212,0.9)] shadow-[0_0_12px_rgba(6,182,212,0.6)]',
    green:    'bg-[rgba(16,185,129,0.9)] shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    red:      'bg-[rgba(239,68,68,0.9)] shadow-[0_0_12px_rgba(239,68,68,0.6)]',
    amber:    'bg-[rgba(245,158,11,0.9)] shadow-[0_0_12px_rgba(245,158,11,0.6)]',
    gradient: 'bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-600 bg-[length:200%] shadow-[0_0_12px_rgba(124,58,237,0.5)]',
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.04)]',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden',
          colorClasses[color],
          color === 'gradient' && 'animate-gradient-shift'
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      >
        {showShimmer && (
          <span
            className="absolute inset-0 opacity-60"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s linear infinite',
            }}
          />
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
