import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-ivy text-white hover:bg-ivy-600 shadow-sm",
  secondary: "bg-terracotta text-white hover:bg-terracotta-600 shadow-sm",
  outline: "border border-ivy-300 bg-white hover:bg-ivy-50 text-ivy",
  ghost: "hover:bg-ivy-50 text-ivy",
};

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-8",
  icon: "h-10 w-10",
};

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivy focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
