import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors";
    
    const variants = {
      default: "bg-maverick-100 text-maverick-700",
      secondary: "bg-gray-100 text-gray-700",
      destructive: "bg-red-100 text-red-700",
      outline: "border border-gray-200 text-gray-700",
      success: "bg-green-100 text-green-700",
      warning: "bg-yellow-100 text-yellow-700",
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
