import { forwardRef } from "react";

export const Card = forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-2xl border border-gray-800/80 bg-gray-900/60 backdrop-blur-xl text-gray-100 shadow-xl shadow-black/30 ${className}`}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef(({ className = "", ...props }, ref) => (
  <h3 ref={ref} className={`font-semibold tracking-tight text-lg text-white ${className}`} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef(({ className = "", ...props }, ref) => (
  <p ref={ref} className={`text-sm text-gray-400 leading-relaxed ${className}`} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex items-center p-6 pt-0 border-t border-gray-800/40 mt-4 ${className}`} {...props} />
));
CardFooter.displayName = "CardFooter";
