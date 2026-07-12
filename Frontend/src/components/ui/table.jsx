export const Table = ({ className = "", ...props }) => (
  <div className="relative w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
  </div>
);

export const TableHeader = ({ className = "", ...props }) => (
  <thead className={`border-b border-gray-800 bg-gray-900/40 ${className}`} {...props} />
);

export const TableBody = ({ className = "", ...props }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
);

export const TableHead = ({ className = "", ...props }) => (
  <th
    className={`h-11 px-4 text-left align-middle font-semibold uppercase tracking-wider text-xs text-gray-400 [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
);

export const TableRow = ({ className = "", ...props }) => (
  <tr
    className={`border-b border-gray-800/60 transition-colors hover:bg-gray-800/30 data-[state=selected]:bg-muted ${className}`}
    {...props}
  />
);

export const TableCell = ({ className = "", ...props }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 text-gray-300 ${className}`} {...props} />
);
