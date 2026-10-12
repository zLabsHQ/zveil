import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "brand" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink-strong text-white shadow-xs hover:bg-[#292524] active:scale-[0.98]",
  secondary:
    "bg-surface border border-border-strong text-ink shadow-xs hover:bg-surface-hover active:scale-[0.98]",
  ghost: "text-ink-soft hover:bg-surface-hover hover:text-ink",
  brand: "bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:scale-[0.98]",
  danger: "text-danger-fg hover:bg-danger-bg",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-md",
  lg: "h-11 px-5 text-sm gap-2 rounded-md",
  xl: "h-[52px] px-6 text-[15px] gap-2 rounded-md",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 ease-out select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
