import { useEffect } from "react";
import { X } from "lucide-react";

export const Dialog = ({ isOpen, onClose, title, children, className = "" }) => {
  // Prevent scrolling behind the modal when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Dialog Frame */}
      <div 
        className={`relative z-10 w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl transition-all duration-300 ${className}`}
      >
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-900 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};
