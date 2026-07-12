import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { OperationsProvider, useOperations } from "./context/OperationsContext.jsx";
import { Toaster } from "react-hot-toast";

// Import Layout Components
import { Sidebar } from "./components/shared/sidebar.jsx";
import { Topbar } from "./components/shared/topbar.jsx";

// Import Pages
import Login from "./pages/Login.jsx";
import Overview from "./pages/Overview.jsx";
import Fleet from "./pages/Fleet.jsx";
import Drivers from "./pages/Drivers.jsx";
import Trips from "./pages/Trips.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Finance from "./pages/Finance.jsx";
import Documents from "./pages/Documents.jsx";
import Analytics from "./pages/Analytics.jsx";

function AppContent() {
  const { isAuthenticated, activeRole } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");

  // Keep track of section changes and automatically redirect on role changes/simulation
  useEffect(() => {
    if (!isAuthenticated) return;

    // Normalizing role (Dispatcher maps to Driver)
    const normalizedRole = activeRole === "Dispatcher" ? "Driver" : activeRole;

    const roleDefaultSections = {
      Admin: "overview",
      "Fleet Manager": "fleet",
      Driver: "overview",
      "Safety Officer": "drivers",
      "Financial Analyst": "finance",
    };

    const targetSection = roleDefaultSections[normalizedRole] || "overview";
    setActiveSection(targetSection);
  }, [activeRole, isAuthenticated]);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Render appropriate subpage component based on state selector
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <Overview />;
      case "fleet":
        return <Fleet />;
      case "drivers":
        return <Drivers />;
      case "trips":
        return <Trips />;
      case "maintenance":
        return <Maintenance />;
      case "finance":
        return <Finance />;
      case "docs":
        return <Documents />;
      case "analytics":
        return <Analytics />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-[#080d16] overflow-hidden text-[#eef3ff]">
      {/* Dynamic Navigation Drawer */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      {/* Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <Topbar />
        
        {/* Main interactive section scroll grid */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OperationsProvider>
        {/* Toast notifications styling context */}
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0f172a",
              color: "#f3f4f6",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "600"
            },
            success: {
              iconTheme: {
                primary: "#f59e0b",
                secondary: "#0f172a"
              }
            }
          }}
        />
        <AppContent />
      </OperationsProvider>
    </AuthProvider>
  );
}