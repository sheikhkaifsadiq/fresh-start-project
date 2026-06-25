'use client'

import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    glow?: boolean
  }
>(({ className, orientation = 'horizontal', decorative = true, glow = false, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 transition-all duration-300',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      glow
        ? 'bg-gradient-to-r from-transparent via-[rgba(124,58,237,0.5)] to-transparent shadow-[0_0_8px_rgba(124,58,237,0.3)]'
        : 'bg-border',
      className
    )}
    {...props}
  />
))
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
