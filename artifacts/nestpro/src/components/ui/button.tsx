import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6FED] focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 select-none active:translate-y-[0.5px]',
  {
    variants: {
      variant: {
        default: 'bg-[#2F6FED] text-white hover:bg-[#245BC2] shadow-sm',
        destructive: 'bg-[#D64545] text-white hover:bg-[#B83838] shadow-sm',
        outline: 'border border-[#E5EAF1] bg-white text-[#173B6C] hover:bg-[#F7F9FC] hover:border-[#CBD5E1] shadow-2xs',
        secondary: 'bg-[#F0F4FA] text-[#173B6C] hover:bg-[#E4ECF7] border border-[#E5EAF1]',
        ghost: 'text-[#667085] hover:bg-[#F7F9FC] hover:text-[#172033]',
        link: 'text-[#2F6FED] underline-offset-4 hover:underline hover:text-[#245BC2]',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8.5 rounded-md px-3 text-xs font-semibold',
        lg: 'h-11 rounded-lg px-6 text-sm font-bold',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
