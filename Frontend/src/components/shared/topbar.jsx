import { useAuth } from "../../context/AuthContext.jsx";
import { useOperations } from "../../context/OperationsContext.jsx";
import { RefreshCw, Users, ShieldAlert } from "lucide-react";

export const Topbar = () => {
  const { user, simulatedRole, changeSimulatedRole } = useAuth();
  const { refresh, loading } = useOperations();

  // Roles that are available to switch/test in the hackathon
  const availableRoles = [
    { value: "", label: `Default (${user?.role_name || "Admin"})` },
    { value: "Fleet Manager", label: "Fleet Manager" },
    { value: "Dispatcher", label: "Dispatcher" },
    { value: "Safety Officer", label: "Safety Officer" },
    { value: "Financial Analyst", label: "Financial Analyst" },
  ];

  return (
    <header className="border-b border-gray-900 bg-gray-950/60 backdrop-blur-md px-8 py-5 flex items-center justify-between sticky top-0 z-40">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-amber-500 font-extrabold">
          Smart Transport Operations Platform
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
          Dispatch, compliance, finance & workshop control.
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Simulator Selector - Great for hackathon testing */}
        <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 space-x-2">
          <Users className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-gray-400">View As:</span>
          <select
            value={simulatedRole}
            onChange={(e) => changeSimulatedRole(e.target.value)}
            className="bg-transparent border-0 text-xs font-bold text-amber-500 focus:ring-0 focus:outline-none cursor-pointer pr-5"
          >
            {availableRoles.map((role) => (
              <option key={role.value} value={role.value} className="bg-gray-950 text-gray-300">
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sync/Refresh button */}
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex h-10 items-center justify-center space-x-2 px-4 rounded-xl border border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white disabled:opacity-50 transition-all cursor-pointer font-semibold text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          <span className="hidden sm:inline">Sync Data</span>
        </button>
      </div>
    </header>
  );
};
