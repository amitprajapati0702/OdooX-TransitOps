import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import { loginRequest } from "./services/authService.js";
import {
  cancelTrip,
  closeMaintenance,
  completeTrip,
  createDriver,
  createExpense,
  createFuelLog,
  createMaintenance,
  createTrip,
  createVehicle,
  dispatchTrip,
  downloadAnalyticsCsv,
  getAnalytics,
  getDashboard,
  getDrivers,
  getExpenses,
  getFuelLogs,
  getMaintenanceRecords,
  getTrips,
  getVehicleDocuments,
  getVehicles,
  sendLicenseReminders,
  uploadVehicleDocument,
} from "./services/operationsService.js";

const initialCredentials = {
  email: "admin@gmail.com",
  password: "Password@123",
  role: "Admin",
};

const navItems = [
  { id: "overview", label: "Overview" },
  { id: "fleet", label: "Fleet" },
  { id: "drivers", label: "Drivers" },
  { id: "trips", label: "Trips" },
  { id: "maintenance", label: "Maintenance" },
  { id: "finance", label: "Finance" },
  { id: "docs", label: "Documents" },
  { id: "analytics", label: "Analytics" },
];

const blankVehicle = {
  registrationNumber: "",
  vehicleNameModel: "",
  type: "Truck",
  maximumLoadCapacityKg: "",
  odometer: "0",
  acquisitionCost: "",
  status: "Available",
  region: "",
};

const blankDriver = {
  fullName: "",
  licenseNumber: "",
  licenseCategory: "",
  licenseExpiryDate: "",
  contactNumber: "",
  safetyScore: "100",
  status: "Available",
  region: "",
};

const blankTrip = {
  source: "",
  destination: "",
  vehicleId: "",
  driverId: "",
  cargoWeightKg: "",
  plannedDistanceKm: "",
  revenue: "0",
  region: "",
  notes: "",
};

const blankMaintenance = {
  vehicleId: "",
  maintenanceType: "Service",
  title: "",
  description: "",
  cost: "0",
};

const blankFuelLog = {
  vehicleId: "",
  tripId: "",
  liters: "",
  cost: "",
  odometer: "",
  loggedAt: "",
};

const blankExpense = {
  vehicleId: "",
  tripId: "",
  category: "Fuel",
  description: "",
  amount: "",
  occurredAt: "",
};

const blankCompletion = {
  finalOdometer: "",
  fuelConsumedLiters: "",
  actualDistanceKm: "",
  revenue: "",
};

const blankDocument = {
  vehicleId: "",
  documentType: "Registration",
  file: null,
};

const blankFilters = {
  vehicleType: "",
  vehicleStatus: "",
  region: "",
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const pillClass = (value = "") => value.toLowerCase().replace(/\s+/g, "-");

function App() {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [authToken, setAuthToken] = useState(localStorage.getItem("transitopsToken") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("transitopsUser");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [notice, setNotice] = useState(null);
  const [filters, setFilters] = useState(blankFilters);
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicleDocuments, setVehicleDocuments] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleForm, setVehicleForm] = useState(blankVehicle);
  const [driverForm, setDriverForm] = useState(blankDriver);
  const [tripForm, setTripForm] = useState(blankTrip);
  const [maintenanceForm, setMaintenanceForm] = useState(blankMaintenance);
  const [fuelLogForm, setFuelLogForm] = useState(blankFuelLog);
  const [expenseForm, setExpenseForm] = useState(blankExpense);
  const [completionForm, setCompletionForm] = useState(blankCompletion);
  const [documentForm, setDocumentForm] = useState(blankDocument);

  const apiReady = useMemo(() => Boolean(authToken), [authToken]);

  const showNotice = (message, kind = "success") => {
    setNotice({ message, kind, timestamp: Date.now() });
    if (kind === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const persistAuth = (nextToken, nextUser) => {
    setAuthToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("transitopsToken", nextToken);
    localStorage.setItem("transitopsUser", JSON.stringify(nextUser));
  };

  const clearAuth = () => {
    setAuthToken("");
    setUser(null);
    localStorage.removeItem("transitopsToken");
    localStorage.removeItem("transitopsUser");
  };

  const loadWorkspace = async (token = authToken, nextFilters = filters) => {
    const [dashboardData, analyticsData, vehicleData, driverData, tripData, maintenanceData, fuelData, expenseData] = await Promise.all([
      getDashboard(token, nextFilters),
      getAnalytics(token, nextFilters),
      getVehicles(token, nextFilters),
      getDrivers(token),
      getTrips(token),
      getMaintenanceRecords(token),
      getFuelLogs(token),
      getExpenses(token),
    ]);

    setDashboard(dashboardData);
    setAnalytics(analyticsData);
    setVehicles(vehicleData);
    setDrivers(driverData);
    setTrips(tripData);
    setMaintenance(maintenanceData);
    setFuelLogs(fuelData);
    setExpenses(expenseData);

    if (!selectedTripId && tripData.length > 0) {
      setSelectedTripId(String(tripData[0].trip_id));
    }

    if (!selectedMaintenanceId && maintenanceData.length > 0) {
      setSelectedMaintenanceId(String(maintenanceData[0].maintenance_id));
    }

    if (!selectedVehicleId && vehicleData.length > 0) {
      const firstVehicle = String(vehicleData[0].vehicle_id);
      setSelectedVehicleId(firstVehicle);
      setDocumentForm((prev) => ({ ...prev, vehicleId: firstVehicle }));
    }
  };

  useEffect(() => {
    if (authToken) {
      loadWorkspace().catch((error) => showNotice(error.message, "error"));
    }
  }, [authToken]);

  const refreshData = async (nextFilters = filters) => {
    await loadWorkspace(authToken, nextFilters);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await loginRequest(credentials);
      persistAuth(result.accessToken, result.user);
      await loadWorkspace(result.accessToken, filters);
      showNotice("Logged in successfully");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      await refreshData(filters);
      showNotice("Filters applied");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const createPayloadNumber = (value) => (value === "" || value === null ? undefined : Number(value));

  const handleVehicleSubmit = async (event) => {
    event.preventDefault();

    try {
      await createVehicle(authToken, {
        ...vehicleForm,
        maximumLoadCapacityKg: createPayloadNumber(vehicleForm.maximumLoadCapacityKg),
        odometer: createPayloadNumber(vehicleForm.odometer),
        acquisitionCost: createPayloadNumber(vehicleForm.acquisitionCost),
      });
      setVehicleForm(blankVehicle);
      await refreshData();
      showNotice("Vehicle created");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleDriverSubmit = async (event) => {
    event.preventDefault();

    try {
      await createDriver(authToken, {
        ...driverForm,
        safetyScore: createPayloadNumber(driverForm.safetyScore),
      });
      setDriverForm(blankDriver);
      await refreshData();
      showNotice("Driver created");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleTripSubmit = async (event) => {
    event.preventDefault();

    try {
      await createTrip(authToken, {
        ...tripForm,
        vehicleId: createPayloadNumber(tripForm.vehicleId),
        driverId: createPayloadNumber(tripForm.driverId),
        cargoWeightKg: createPayloadNumber(tripForm.cargoWeightKg),
        plannedDistanceKm: createPayloadNumber(tripForm.plannedDistanceKm),
        revenue: createPayloadNumber(tripForm.revenue),
      });
      setTripForm(blankTrip);
      await refreshData();
      showNotice("Trip drafted");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleMaintenanceSubmit = async (event) => {
    event.preventDefault();

    try {
      await createMaintenance(authToken, {
        ...maintenanceForm,
        vehicleId: createPayloadNumber(maintenanceForm.vehicleId),
        cost: createPayloadNumber(maintenanceForm.cost),
      });
      setMaintenanceForm(blankMaintenance);
      await refreshData();
      showNotice("Maintenance logged");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleFuelSubmit = async (event) => {
    event.preventDefault();

    try {
      await createFuelLog(authToken, {
        vehicleId: createPayloadNumber(fuelLogForm.vehicleId),
        tripId: fuelLogForm.tripId ? createPayloadNumber(fuelLogForm.tripId) : null,
        liters: createPayloadNumber(fuelLogForm.liters),
        cost: createPayloadNumber(fuelLogForm.cost),
        odometer: fuelLogForm.odometer ? createPayloadNumber(fuelLogForm.odometer) : null,
        loggedAt: fuelLogForm.loggedAt || undefined,
      });
      setFuelLogForm(blankFuelLog);
      await refreshData();
      showNotice("Fuel log saved");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();

    try {
      await createExpense(authToken, {
        vehicleId: expenseForm.vehicleId ? createPayloadNumber(expenseForm.vehicleId) : null,
        tripId: expenseForm.tripId ? createPayloadNumber(expenseForm.tripId) : null,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: createPayloadNumber(expenseForm.amount),
        occurredAt: expenseForm.occurredAt || undefined,
      });
      setExpenseForm(blankExpense);
      await refreshData();
      showNotice("Expense recorded");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleDispatchTrip = async () => {
    if (!selectedTripId) {
      showNotice("Select a trip first", "error");
      return;
    }

    try {
      await dispatchTrip(authToken, selectedTripId);
      await refreshData();
      showNotice("Trip dispatched");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleCompleteTrip = async () => {
    if (!selectedTripId) {
      showNotice("Select a trip first", "error");
      return;
    }

    try {
      await completeTrip(authToken, selectedTripId, {
        finalOdometer: createPayloadNumber(completionForm.finalOdometer),
        fuelConsumedLiters: createPayloadNumber(completionForm.fuelConsumedLiters),
        actualDistanceKm: completionForm.actualDistanceKm ? createPayloadNumber(completionForm.actualDistanceKm) : undefined,
        revenue: completionForm.revenue ? createPayloadNumber(completionForm.revenue) : undefined,
      });
      setCompletionForm(blankCompletion);
      await refreshData();
      showNotice("Trip completed");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleCancelTrip = async () => {
    if (!selectedTripId) {
      showNotice("Select a trip first", "error");
      return;
    }

    try {
      await cancelTrip(authToken, selectedTripId);
      await refreshData();
      showNotice("Trip cancelled");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleCloseMaintenance = async () => {
    if (!selectedMaintenanceId) {
      showNotice("Select a maintenance record first", "error");
      return;
    }

    try {
      await closeMaintenance(authToken, selectedMaintenanceId, {});
      await refreshData();
      showNotice("Maintenance closed");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleReminder = async () => {
    try {
      const result = await sendLicenseReminders(authToken, { withinDays: 30 });
      showNotice(`Reminder job done: ${result.sent || 0} sent`);
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleAnalyticsExport = async () => {
    try {
      const blob = await downloadAnalyticsCsv(authToken, filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transitops-analytics.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotice("CSV exported");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const selectVehicleDocuments = async (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setDocumentForm((prev) => ({ ...prev, vehicleId }));

    if (!vehicleId) {
      setVehicleDocuments([]);
      return;
    }

    try {
      const docs = await getVehicleDocuments(authToken, vehicleId);
      setVehicleDocuments(docs);
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();

    if (!documentForm.vehicleId || !documentForm.file) {
      showNotice("Choose a vehicle and file", "error");
      return;
    }

    const formData = new FormData();
    formData.append("vehicleId", documentForm.vehicleId);
    formData.append("documentType", documentForm.documentType);
    formData.append("file", documentForm.file);

    try {
      await uploadVehicleDocument(authToken, formData);
      setDocumentForm((prev) => ({ ...blankDocument, vehicleId: prev.vehicleId }));
      const docs = await getVehicleDocuments(authToken, documentForm.vehicleId);
      setVehicleDocuments(docs);
      showNotice("Document uploaded");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  if (!apiReady) {
    return (
      <div className="shell auth-shell">
        <Toaster position="top-right" />
        <section className="hero-panel">
          <div className="eyebrow">TransitOps</div>
          <h1>Enterprise transport operations, built for dispatch and control.</h1>
          <p>
            A responsive console for fleet managers, drivers, safety officers, and finance teams. Sign in with the seeded demo account or your own backend user.
          </p>
          <div className="hero-metrics">
            <div>
              <strong>Fleet</strong>
              <span>Vehicles, drivers, trips, maintenance, fuel, expenses</span>
            </div>
            <div>
              <strong>Rules</strong>
              <span>Status guards, capacity checks, RBAC, reminders</span>
            </div>
            <div>
              <strong>Output</strong>
              <span>CSV export, uploads, and operational visibility</span>
            </div>
          </div>
        </section>

        <form className="auth-card" onSubmit={handleLogin}>
          <h2>Sign in</h2>
          <label>
            Email
            <input value={credentials.email} onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))} />
          </label>
          <label>
            Password
            <input type="password" value={credentials.password} onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))} />
          </label>
          <label>
            Role
            <select value={credentials.role} onChange={(e) => setCredentials((prev) => ({ ...prev, role: e.target.value }))}>
              <option>Admin</option>
              <option>Fleet Manager</option>
              <option>Driver</option>
              <option>Safety Officer</option>
              <option>Financial Analyst</option>
            </select>
          </label>
          <button disabled={loading}>{loading ? "Signing in..." : "Enter dashboard"}</button>
          <small>Seeded admin example: admin@gmail.com / Password@123</small>
        </form>
      </div>
    );
  }

  const stats = [
    ["Active Vehicles", dashboard?.active_vehicles],
    ["Available Vehicles", dashboard?.available_vehicles],
    ["Vehicles In Shop", dashboard?.vehicles_in_maintenance],
    ["Active Trips", dashboard?.active_trips],
    ["Pending Trips", dashboard?.pending_trips],
    ["Drivers On Duty", dashboard?.drivers_on_duty],
    ["Fleet Utilization", `${compact.format(dashboard?.fleet_utilization_pct || 0)}%`],
    ["Operational Cost", currency.format(dashboard?.total_operational_cost || 0)],
  ];

  return (
    <div className="shell dashboard-shell">
      <Toaster position="top-right" />

      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">T</div>
          <div>
            <strong>TransitOps</strong>
            <span>Control center</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <span>Signed in as</span>
            <strong>{user?.full_name || user?.email || "Operator"}</strong>
          </div>
          <button type="button" className="ghost-btn" onClick={clearAuth}>Logout</button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">Smart transport operations platform</div>
            <h1>Dispatch, compliance, finance, and analytics in one responsive workspace.</h1>
            <p>
              Manage fleets with live business rules: capacity validation, maintenance lockouts, driver status enforcement, and operational reporting.
            </p>
          </div>
          <div className="topbar-actions">
            <button className="secondary-btn" type="button" onClick={() => refreshData()}>Refresh</button>
            <button className="secondary-btn" type="button" onClick={handleReminder}>Send reminders</button>
            <button className="primary-btn" type="button" onClick={handleAnalyticsExport}>Export CSV</button>
          </div>
        </header>

        {notice ? <div className={`notice ${notice.kind}`}>{notice.message}</div> : null}

        <section id="overview" className="section-block visible">
          <div className="section-heading">
            <div>
              <h2>Operational snapshot</h2>
              <p>Business KPIs powered by the backend dashboard and analytics endpoints.</p>
            </div>
            <div className="filters">
              <input placeholder="Vehicle type" value={filters.vehicleType} onChange={(e) => setFilters((prev) => ({ ...prev, vehicleType: e.target.value }))} />
              <select value={filters.vehicleStatus} onChange={(e) => setFilters((prev) => ({ ...prev, vehicleStatus: e.target.value }))}>
                <option value="">All statuses</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
              <input placeholder="Region" value={filters.region} onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))} />
              <button type="button" className="primary-btn" onClick={applyFilters}>Apply</button>
            </div>
          </div>

          <div className="metric-grid">
            {stats.map(([label, value]) => (
              <article className="metric-card" key={label}>
                <span>{label}</span>
                <strong>{value ?? 0}</strong>
              </article>
            ))}
          </div>

          <div className="split-grid">
            <article className="panel">
              <div className="panel-heading">
                <h3>Fleet utilization</h3>
                <span>Vehicles, maintenance, retired status</span>
              </div>
              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>Reg. No.</th>
                      <th>Model</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.slice(0, 6).map((vehicle) => (
                      <tr key={vehicle.vehicle_id}>
                        <td>{vehicle.registration_number}</td>
                        <td>{vehicle.vehicle_name_model}</td>
                        <td>{vehicle.type}</td>
                        <td><span className={`pill ${pillClass(vehicle.status)}`}>{vehicle.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h3>Quick analytics</h3>
                <span>Fuel efficiency and ROI</span>
              </div>
              <div className="analytics-card-list">
                {analytics.slice(0, 5).map((row) => (
                  <div key={row.vehicle_id} className="analytics-card">
                    <div>
                      <strong>{row.registration_number}</strong>
                      <span>{row.vehicle_name_model}</span>
                    </div>
                    <div>
                      <strong>{compact.format(row.fuel_efficiency)} km/L</strong>
                      <span>ROI: {compact.format(row.roi)}</span>
                    </div>
                    <div>
                      <strong>{currency.format(row.operational_cost || 0)}</strong>
                      <span>Cost</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section id="fleet" className={activeSection === "fleet" ? "section-block visible" : "section-block"}>
          <div className="section-heading"><div><h2>Fleet registry</h2><p>Create and manage vehicles from the backend API.</p></div></div>
          <div className="split-grid forms-grid">
            <form className="panel form-panel" onSubmit={handleVehicleSubmit}>
              <h3>Create vehicle</h3>
              <div className="form-grid">
                <input placeholder="Registration number" value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm((prev) => ({ ...prev, registrationNumber: e.target.value }))} />
                <input placeholder="Vehicle model" value={vehicleForm.vehicleNameModel} onChange={(e) => setVehicleForm((prev) => ({ ...prev, vehicleNameModel: e.target.value }))} />
                <input placeholder="Type" value={vehicleForm.type} onChange={(e) => setVehicleForm((prev) => ({ ...prev, type: e.target.value }))} />
                <input type="number" placeholder="Capacity (kg)" value={vehicleForm.maximumLoadCapacityKg} onChange={(e) => setVehicleForm((prev) => ({ ...prev, maximumLoadCapacityKg: e.target.value }))} />
                <input type="number" placeholder="Odometer" value={vehicleForm.odometer} onChange={(e) => setVehicleForm((prev) => ({ ...prev, odometer: e.target.value }))} />
                <input type="number" placeholder="Acquisition cost" value={vehicleForm.acquisitionCost} onChange={(e) => setVehicleForm((prev) => ({ ...prev, acquisitionCost: e.target.value }))} />
                <select value={vehicleForm.status} onChange={(e) => setVehicleForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option>Available</option><option>On Trip</option><option>In Shop</option><option>Retired</option>
                </select>
                <input placeholder="Region" value={vehicleForm.region} onChange={(e) => setVehicleForm((prev) => ({ ...prev, region: e.target.value }))} />
              </div>
              <button className="primary-btn" type="submit">Save vehicle</button>
            </form>

            <article className="panel table-panel">
              <h3>Vehicle list</h3>
              <div className="table-shell compact-table">
                <table>
                  <thead><tr><th>Reg. No.</th><th>Capacity</th><th>Odometer</th><th>Status</th></tr></thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.vehicle_id}>
                        <td><strong>{vehicle.registration_number}</strong><div className="muted">{vehicle.vehicle_name_model}</div></td>
                        <td>{compact.format(vehicle.maximum_load_capacity_kg)} kg</td>
                        <td>{compact.format(vehicle.odometer)}</td>
                        <td><span className={`pill ${pillClass(vehicle.status)}`}>{vehicle.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <section id="drivers" className={activeSection === "drivers" ? "section-block visible" : "section-block"}>
          <div className="section-heading"><div><h2>Driver management</h2><p>License-aware profiles with status control.</p></div></div>
          <div className="split-grid forms-grid">
            <form className="panel form-panel" onSubmit={handleDriverSubmit}>
              <h3>Create driver</h3>
              <div className="form-grid">
                <input placeholder="Full name" value={driverForm.fullName} onChange={(e) => setDriverForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                <input placeholder="License number" value={driverForm.licenseNumber} onChange={(e) => setDriverForm((prev) => ({ ...prev, licenseNumber: e.target.value }))} />
                <input placeholder="License category" value={driverForm.licenseCategory} onChange={(e) => setDriverForm((prev) => ({ ...prev, licenseCategory: e.target.value }))} />
                <input type="date" value={driverForm.licenseExpiryDate} onChange={(e) => setDriverForm((prev) => ({ ...prev, licenseExpiryDate: e.target.value }))} />
                <input placeholder="Contact number" value={driverForm.contactNumber} onChange={(e) => setDriverForm((prev) => ({ ...prev, contactNumber: e.target.value }))} />
                <input type="number" placeholder="Safety score" value={driverForm.safetyScore} onChange={(e) => setDriverForm((prev) => ({ ...prev, safetyScore: e.target.value }))} />
                <select value={driverForm.status} onChange={(e) => setDriverForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option>Available</option><option>On Trip</option><option>Off Duty</option><option>Suspended</option>
                </select>
                <input placeholder="Region" value={driverForm.region} onChange={(e) => setDriverForm((prev) => ({ ...prev, region: e.target.value }))} />
              </div>
              <button className="primary-btn" type="submit">Save driver</button>
            </form>

            <article className="panel table-panel">
              <h3>Driver list</h3>
              <div className="table-shell compact-table">
                <table>
                  <thead><tr><th>Driver</th><th>License</th><th>Expiry</th><th>Status</th></tr></thead>
                  <tbody>
                    {drivers.map((driver) => (
                      <tr key={driver.driver_id}>
                        <td>{driver.full_name}</td>
                        <td>{driver.license_number}</td>
                        <td>{driver.license_expiry_date?.slice(0, 10)}</td>
                        <td><span className={`pill ${pillClass(driver.status)}`}>{driver.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <section id="trips" className={activeSection === "trips" ? "section-block visible" : "section-block"}>
          <div className="section-heading"><div><h2>Trip operations</h2><p>Draft, dispatch, complete, and cancel trips with status enforcement.</p></div></div>
          <div className="split-grid forms-grid">
            <form className="panel form-panel" onSubmit={handleTripSubmit}>
              <h3>Create trip</h3>
              <div className="form-grid">
                <input placeholder="Source" value={tripForm.source} onChange={(e) => setTripForm((prev) => ({ ...prev, source: e.target.value }))} />
                <input placeholder="Destination" value={tripForm.destination} onChange={(e) => setTripForm((prev) => ({ ...prev, destination: e.target.value }))} />
                <select value={tripForm.vehicleId} onChange={(e) => setTripForm((prev) => ({ ...prev, vehicleId: e.target.value }))}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>{vehicle.registration_number}</option>)}
                </select>
                <select value={tripForm.driverId} onChange={(e) => setTripForm((prev) => ({ ...prev, driverId: e.target.value }))}>
                  <option value="">Select driver</option>
                  {drivers.map((driver) => <option key={driver.driver_id} value={driver.driver_id}>{driver.full_name}</option>)}
                </select>
                <input type="number" placeholder="Cargo weight (kg)" value={tripForm.cargoWeightKg} onChange={(e) => setTripForm((prev) => ({ ...prev, cargoWeightKg: e.target.value }))} />
                <input type="number" placeholder="Planned distance (km)" value={tripForm.plannedDistanceKm} onChange={(e) => setTripForm((prev) => ({ ...prev, plannedDistanceKm: e.target.value }))} />
                <input type="number" placeholder="Revenue" value={tripForm.revenue} onChange={(e) => setTripForm((prev) => ({ ...prev, revenue: e.target.value }))} />
                <input placeholder="Region" value={tripForm.region} onChange={(e) => setTripForm((prev) => ({ ...prev, region: e.target.value }))} />
                <textarea placeholder="Notes" value={tripForm.notes} onChange={(e) => setTripForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
              <button className="primary-btn" type="submit">Save trip draft</button>
            </form>

            <article className="panel table-panel">
              <h3>Trip list and actions</h3>
              <div className="actions-strip">
                <select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)}>
                  <option value="">Select trip</option>
                  {trips.map((trip) => <option key={trip.trip_id} value={trip.trip_id}>{trip.trip_code} - {trip.source}</option>)}
                </select>
                <button type="button" className="secondary-btn" onClick={handleDispatchTrip}>Dispatch</button>
                <button type="button" className="secondary-btn" onClick={handleCancelTrip}>Cancel</button>
              </div>

              <div className="form-grid trip-complete">
                <input type="number" placeholder="Final odometer" value={completionForm.finalOdometer} onChange={(e) => setCompletionForm((prev) => ({ ...prev, finalOdometer: e.target.value }))} />
                <input type="number" placeholder="Fuel consumed" value={completionForm.fuelConsumedLiters} onChange={(e) => setCompletionForm((prev) => ({ ...prev, fuelConsumedLiters: e.target.value }))} />
                <input type="number" placeholder="Actual distance" value={completionForm.actualDistanceKm} onChange={(e) => setCompletionForm((prev) => ({ ...prev, actualDistanceKm: e.target.value }))} />
                <input type="number" placeholder="Revenue" value={completionForm.revenue} onChange={(e) => setCompletionForm((prev) => ({ ...prev, revenue: e.target.value }))} />
              </div>
              <button className="primary-btn" type="button" onClick={handleCompleteTrip}>Complete selected trip</button>

              <div className="table-shell compact-table top-gap">
                <table>
                  <thead><tr><th>Trip</th><th>Vehicle</th><th>Driver</th><th>Status</th></tr></thead>
                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip.trip_id}>
                        <td><strong>{trip.trip_code}</strong><div className="muted">{trip.source} → {trip.destination}</div></td>
                        <td>{trip.registration_number}</td>
                        <td>{trip.driver_name}</td>
                        <td><span className={`pill ${pillClass(trip.status)}`}>{trip.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <section id="maintenance" className={activeSection === "maintenance" ? "section-block visible" : "section-block"}>
          <div className="section-heading"><div><h2>Maintenance control</h2><p>Entering active maintenance moves a vehicle into the shop automatically.</p></div></div>
          <div className="split-grid forms-grid">
            <form className="panel form-panel" onSubmit={handleMaintenanceSubmit}>
              <h3>Create maintenance record</h3>
              <div className="form-grid">
                <select value={maintenanceForm.vehicleId} onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, vehicleId: e.target.value }))}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>{vehicle.registration_number}</option>)}
                </select>
                <input placeholder="Maintenance type" value={maintenanceForm.maintenanceType} onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, maintenanceType: e.target.value }))} />
                <input placeholder="Title" value={maintenanceForm.title} onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, title: e.target.value }))} />
                <input type="number" placeholder="Cost" value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, cost: e.target.value }))} />
                <textarea placeholder="Description" value={maintenanceForm.description} onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <button className="primary-btn" type="submit">Log maintenance</button>
            </form>

            <article className="panel table-panel">
              <div className="actions-strip">
                <select value={selectedMaintenanceId} onChange={(e) => setSelectedMaintenanceId(e.target.value)}>
                  <option value="">Select maintenance record</option>
                  {maintenance.map((record) => <option key={record.maintenance_id} value={record.maintenance_id}>{record.title}</option>)}
                </select>
                <button type="button" className="secondary-btn" onClick={handleCloseMaintenance}>Close maintenance</button>
              </div>
              <div className="table-shell compact-table top-gap">
                <table>
                  <thead><tr><th>Vehicle</th><th>Type</th><th>Cost</th><th>Status</th></tr></thead>
                  <tbody>
                    {maintenance.map((record) => (
                      <tr key={record.maintenance_id}>
                        <td>{record.registration_number}</td>
                        <td>{record.maintenance_type}</td>
                        <td>{currency.format(record.cost || 0)}</td>
                        <td><span className={`pill ${pillClass(record.status)}`}>{record.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <section id="finance" className={activeSection === "finance" ? "section-block visible" : "section-block"}>
          <div className="section-heading"><div><h2>Fuel and expenses</h2><p>Capture operational cost data and maintain profitability visibility.</p></div></div>
          <div className="split-grid forms-grid">
            <form className="panel form-panel" onSubmit={handleFuelSubmit}>
              <h3>Fuel log</h3>
              <div className="form-grid">
                <select value={fuelLogForm.vehicleId} onChange={(e) => setFuelLogForm((prev) => ({ ...prev, vehicleId: e.target.value }))}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>{vehicle.registration_number}</option>)}
                </select>
                <select value={fuelLogForm.tripId} onChange={(e) => setFuelLogForm((prev) => ({ ...prev, tripId: e.target.value }))}>
                  <option value="">Optional trip</option>
                  {trips.map((trip) => <option key={trip.trip_id} value={trip.trip_id}>{trip.trip_code}</option>)}
                </select>
                <input type="number" placeholder="Liters" value={fuelLogForm.liters} onChange={(e) => setFuelLogForm((prev) => ({ ...prev, liters: e.target.value }))} />
                <input type="number" placeholder="Cost" value={fuelLogForm.cost} onChange={(e) => setFuelLogForm((prev) => ({ ...prev, cost: e.target.value }))} />
                <input type="number" placeholder="Odometer" value={fuelLogForm.odometer} onChange={(e) => setFuelLogForm((prev) => ({ ...prev, odometer: e.target.value }))} />
                <input type="datetime-local" value={fuelLogForm.loggedAt} onChange={(e) => setFuelLogForm((prev) => ({ ...prev, loggedAt: e.target.value }))} />
              </div>
              <button className="primary-btn" type="submit">Save fuel log</button>
            </form>

            <form className="panel form-panel" onSubmit={handleExpenseSubmit}>
              <h3>Expense</h3>
              <div className="form-grid">
                <select value={expenseForm.vehicleId} onChange={(e) => setExpenseForm((prev) => ({ ...prev, vehicleId: e.target.value }))}>
                  <option value="">Optional vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>{vehicle.registration_number}</option>)}
                </select>
                <select value={expenseForm.tripId} onChange={(e) => setExpenseForm((prev) => ({ ...prev, tripId: e.target.value }))}>
                  <option value="">Optional trip</option>
                  {trips.map((trip) => <option key={trip.trip_id} value={trip.trip_id}>{trip.trip_code}</option>)}
                </select>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}>
                  <option>Fuel</option><option>Maintenance</option><option>Toll</option><option>Parking</option><option>Misc</option>
                </select>
                <input type="number" placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} />
                <input placeholder="Description" value={expenseForm.description} onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))} />
                <input type="datetime-local" value={expenseForm.occurredAt} onChange={(e) => setExpenseForm((prev) => ({ ...prev, occurredAt: e.target.value }))} />
              </div>
              <button className="primary-btn" type="submit">Save expense</button>
            </form>

            <article className="panel table-panel full-width">
              <h3>Expense ledger</h3>
              <div className="table-shell compact-table">
                <table>
                  <thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Trip</th></tr></thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.expense_id}>
                        <td>{expense.category}</td>
                        <td>{expense.description || "-"}</td>
                        <td>{currency.format(expense.amount || 0)}</td>
                        <td>{expense.trip_code || expense.registration_number || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <section id="docs" className={activeSection === "docs" ? "section-block visible" : "section-block"}>
          <div className="section-heading"><div><h2>Vehicle documents</h2><p>Upload and review registration, insurance, permit, and fitness documents.</p></div></div>
          <div className="split-grid forms-grid">
            <form className="panel form-panel" onSubmit={handleDocumentUpload}>
              <h3>Upload document</h3>
              <div className="form-grid">
                <select value={documentForm.vehicleId} onChange={(e) => selectVehicleDocuments(e.target.value)}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>{vehicle.registration_number}</option>)}
                </select>
                <select value={documentForm.documentType} onChange={(e) => setDocumentForm((prev) => ({ ...prev, documentType: e.target.value }))}>
                  <option>Registration</option>
                  <option>Insurance</option>
                  <option>Fitness</option>
                  <option>Permit</option>
                  <option>Other</option>
                </select>
                <input type="file" onChange={(e) => setDocumentForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} />
              </div>
              <button className="primary-btn" type="submit">Upload</button>
            </form>

            <article className="panel table-panel">
              <h3>Uploaded documents</h3>
              <div className="table-shell compact-table">
                <table>
                  <thead><tr><th>Vehicle</th><th>Document</th><th>File</th><th>Uploaded</th></tr></thead>
                  <tbody>
                    {vehicleDocuments.map((document) => (
                      <tr key={document.document_id}>
                        <td>{document.vehicle_id}</td>
                        <td>{document.document_type}</td>
                        <td>{document.original_name}</td>
                        <td>{document.uploaded_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <section id="analytics" className={activeSection === "analytics" ? "section-block visible" : "section-block"}>
          <div className="section-heading"><div><h2>Analytics and reporting</h2><p>Fuel efficiency, utilization, ROI, and operational costs.</p></div></div>
          <div className="split-grid">
            <article className="panel">
              <h3>Analytics summary</h3>
              <div className="analytics-card-list">
                {analytics.slice(0, 10).map((row) => (
                  <div key={row.vehicle_id} className="analytics-card stacked">
                    <div>
                      <strong>{row.registration_number}</strong>
                      <span>{row.type} · {row.region || "No region"}</span>
                    </div>
                    <div className="analytics-values">
                      <span><strong>{compact.format(row.total_distance_km || 0)}</strong> km</span>
                      <span><strong>{compact.format(row.fuel_liters || 0)}</strong> L</span>
                      <span><strong>{compact.format(row.fuel_efficiency || 0)}</strong> km/L</span>
                      <span><strong>{currency.format(row.operational_cost || 0)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <h3>Trip activity trail</h3>
              <div className="timeline">
                {trips.slice(0, 5).map((trip) => (
                  <div key={trip.trip_id} className="timeline-item">
                    <span className={`dot ${pillClass(trip.status)}`}></span>
                    <div>
                      <strong>{trip.trip_code}</strong>
                      <p>{trip.source} → {trip.destination} · {trip.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;