import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-[#D6E4FF] bg-[#EFF5FF] text-[#2F6FED]',
        secondary: 'border-[#E5EAF1] bg-[#F0F4FA] text-[#667085]',
        success: 'border-[#C8E6C9] bg-[#E8F5E9] text-[#16845B]',
        warning: 'border-[#FFE082] bg-[#FFF8E1] text-[#D98A00]',
        destructive: 'border-[#FFCDD2] bg-[#FFEBEE] text-[#D64545]',
        outline: 'border-[#E5EAF1] bg-white text-[#667085]',
        ghost: 'border-transparent bg-transparent text-[#667085]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
