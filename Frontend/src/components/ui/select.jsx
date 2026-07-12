import { forwardRef } from "react";

export const Select = forwardRef(({ className = "", error, label, children, ...props }, ref) => {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`flex h-11 w-full items-center justify-between rounded-xl border bg-gray-900/80 px-3.5 py-2 text-sm text-white ring-offset-[#0b0f19] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all duration-150 ${
            error ? "border-red-500 focus:ring-red-500" : "border-gray-800 focus:ring-amber-500"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Select.displayName = "Select";
