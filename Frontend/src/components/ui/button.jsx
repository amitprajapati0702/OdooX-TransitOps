import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export const Button = forwardRef(
  ({ className = "", variant = "default", size = "default", loading = false, disabled, children, type = "button", ...props }, ref) => {
    
    // Base styling for modern, premium buttons with clean transitions
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19] active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
    
    const variants = {
      default: "bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-500 hover:to-orange-600 shadow-md shadow-orange-900/20 border border-orange-500/20",
      outline: "border border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800/80 hover:text-white",
      secondary: "bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700/50",
      ghost: "text-gray-400 hover:bg-gray-800/60 hover:text-white bg-transparent",
      destructive: "bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-900/10",
    };

    const sizes = {
      default: "h-11 px-5 py-2.5 text-sm",
      sm: "h-9 rounded-lg px-3.5 py-1.5 text-xs",
      lg: "h-12 px-7 py-3 text-base",
      icon: "h-10 w-10 p-0",
    };

    const currentVariant = variants[variant] || variants.default;
    const currentSize = sizes[size] || sizes.default;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
