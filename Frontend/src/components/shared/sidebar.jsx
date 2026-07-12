import { useAuth } from "../../context/AuthContext.jsx";
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  MapPin, 
  Wrench, 
  CircleDollarSign, 
  BarChart3, 
  FileText, 
  LogOut,
  ShieldCheck
} from "lucide-react";

export const Sidebar = ({ activeSection, setActiveSection }) => {
  const { user, activeRole, logout } = useAuth();

  // Navigation Items definitions with matching permissions
  const allNavItems = [
    { 
      id: "overview", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      roles: ["Admin", "Driver", "Dispatcher"] 
    },
    { 
      id: "fleet", 
      label: "Fleet", 
      icon: Truck,
      roles: ["Admin", "Fleet Manager"] 
    },
    { 
      id: "drivers", 
      label: "Drivers", 
      icon: Users,
      roles: ["Admin", "Safety Officer"] 
    },
    { 
      id: "trips", 
      label: "Trips", 
      icon: MapPin,
      roles: ["Admin", "Driver", "Dispatcher"] 
    },
    { 
      id: "maintenance", 
      label: "Maintenance", 
      icon: Wrench,
      roles: ["Admin", "Fleet Manager"] 
    },
    { 
      id: "finance", 
      label: "Fuel & Expenses", 
      icon: CircleDollarSign,
      roles: ["Admin", "Financial Analyst"] 
    },
    { 
      id: "docs", 
      label: "Documents", 
      icon: FileText,
      roles: ["Admin", "Fleet Manager", "Safety Officer"] 
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: BarChart3,
      roles: ["Admin", "Financial Analyst"] 
    },
  ];

  // Filter items based on activeRole
  const filteredNavItems = allNavItems.filter(item => {
    if (!activeRole) return false;
    // Map Dispatcher to Driver internally for permissions check
    const normalizedRole = activeRole === "Dispatcher" ? "Driver" : activeRole;
    return item.roles.includes("Admin") || item.roles.includes(normalizedRole);
  });

  return (
    <aside className="w-72 bg-gray-950 border-r border-gray-900 flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0">
      <div className="flex flex-col space-y-8">
        {/* Brand Block */}
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-[#0b0f19] text-xl shadow-lg shadow-orange-950/40">
            T
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight tracking-wider uppercase">TransitOps</h1>
            <span className="text-[10px] tracking-widest text-amber-500 font-extrabold uppercase">Control Center</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col space-y-1.5">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center space-x-3.5 px-4.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-gradient-to-r from-amber-600/10 to-orange-700/10 text-amber-400 border-l-4 border-amber-500 shadow-md shadow-orange-950/10" 
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-900/60"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-amber-400 animate-pulse" : "text-gray-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User block & Logout */}
      <div className="border-t border-gray-900 pt-5 flex flex-col space-y-4">
        <div className="flex items-center space-x-3 px-1">
          <div className="h-10 w-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center font-bold text-amber-500 text-sm shadow-inner">
            {user?.full_name ? user.full_name.charAt(0) : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate leading-snug">
              {user?.full_name || "Operator"}
            </h4>
            <div className="flex items-center text-[10px] text-gray-500 font-medium space-x-1.5 truncate">
              <ShieldCheck className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="truncate uppercase font-bold text-amber-500">{activeRole}</span>
            </div>
          </div>
        </div>
        
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-900 hover:bg-red-950/20 text-gray-400 hover:text-red-400 border border-gray-800 hover:border-red-900/30 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
};
