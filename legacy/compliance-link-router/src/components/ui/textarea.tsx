import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl px-3 py-2 text-sm',
          'bg-[rgba(255,255,255,0.04)] border border-[rgba(124,58,237,0.2)]',
          'text-[rgba(255,255,255,0.85)] placeholder:text-[rgba(255,255,255,0.3)]',
          'ring-offset-background transition-all duration-200',
          'focus-visible:outline-none focus-visible:border-[rgba(124,58,237,0.5)]',
          'focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]',
          'hover:border-[rgba(124,58,237,0.3)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
