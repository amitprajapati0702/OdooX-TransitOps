export const Badge = ({ children, variant = "default", className = "" }) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", // Available / Completed
    info: "bg-sky-500/10 text-sky-400 border border-sky-500/20", // On Trip / Dispatched
    warning: "bg-orange-500/10 text-orange-400 border border-orange-500/20", // In Shop / Suspended
    destructive: "bg-rose-500/10 text-rose-400 border border-rose-500/20", // Retired / Cancelled
    secondary: "bg-gray-800 text-gray-400 border border-gray-700/50", // Off Duty / Draft
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <span className={`${baseStyles} ${currentVariant} ${className}`}>
      {children}
    </span>
  );
};

export const getStatusBadge = (status = "") => {
  const lower = status.toLowerCase();
  
  // Vehicle statuses
  if (lower === "available") return <Badge variant="success">Available</Badge>;
  if (lower === "on trip") return <Badge variant="info">On Trip</Badge>;
  if (lower === "in shop") return <Badge variant="warning">In Shop</Badge>;
  if (lower === "retired") return <Badge variant="destructive">Retired</Badge>;
  
  // Driver statuses
  if (lower === "off duty") return <Badge variant="secondary">Off Duty</Badge>;
  if (lower === "suspended") return <Badge variant="warning">Suspended</Badge>;
  
  // Trip statuses
  if (lower === "draft") return <Badge variant="secondary">Draft</Badge>;
  if (lower === "dispatched") return <Badge variant="info">Dispatched</Badge>;
  if (lower === "completed") return <Badge variant="success">Completed</Badge>;
  if (lower === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  
  // Maintenance statuses
  if (lower === "open") return <Badge variant="warning">Open</Badge>;
  if (lower === "closed") return <Badge variant="success">Closed</Badge>;

  return <Badge>{status}</Badge>;
};
