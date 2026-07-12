import { forwardRef } from "react";

export const Input = forwardRef(({ className = "", type = "text", error, label, ...props }, ref) => {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </label>
      )}
      <input
        type={type}
        ref={ref}
        className={`flex h-11 w-full rounded-xl border bg-gray-900/80 px-3.5 py-2 text-sm text-white ring-offset-[#0b0f19] placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 ${
          error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-800 focus-visible:ring-amber-500"
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = "Input";
