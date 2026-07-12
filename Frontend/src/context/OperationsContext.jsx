import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  getDashboard,
  getAnalytics,
  getVehicles,
  createVehicle,
  updateVehicle,
  getDrivers,
  createDriver,
  updateDriver,
  getTrips,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getMaintenanceRecords,
  createMaintenance,
  closeMaintenance,
  getFuelLogs,
  createFuelLog,
  getExpenses,
  createExpense,
  sendLicenseReminders,
  downloadAnalyticsCsv
} from "../services/operationsService.js";
import toast from "react-hot-toast";

const OperationsContext = createContext(null);

export const OperationsProvider = ({ children }) => {
  const { authToken, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  const [filters, setFilters] = useState({
    vehicleType: "",
    vehicleStatus: "",
    region: "",
  });

  const fetchAllData = useCallback(async (token = authToken, activeFilters = filters) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const [
        dashboardData,
        analyticsData,
        vehiclesData,
        driversData,
        tripsData,
        maintenanceData,
        fuelData,
        expensesData
      ] = await Promise.all([
        getDashboard(token, activeFilters).catch(err => { console.error("Dashboard error:", err); return null; }),
        getAnalytics(token, activeFilters).catch(err => { console.error("Analytics error:", err); return []; }),
        getVehicles(token, activeFilters).catch(err => { console.error("Vehicles error:", err); return []; }),
        getDrivers(token).catch(err => { console.error("Drivers error:", err); return []; }),
        getTrips(token).catch(err => { console.error("Trips error:", err); return []; }),
        getMaintenanceRecords(token).catch(err => { console.error("Maintenance error:", err); return []; }),
        getFuelLogs(token).catch(err => { console.error("FuelLogs error:", err); return []; }),
        getExpenses(token).catch(err => { console.error("Expenses error:", err); return []; }),
      ]);

      if (dashboardData) setDashboard(dashboardData);
      setAnalytics(analyticsData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setTrips(tripsData);
      setMaintenance(maintenanceData);
      setFuelLogs(fuelData);
      setExpenses(expensesData);
    } catch (err) {
      console.error("Error loading workspace data:", err);
      toast.error("Failed to sync some operational records with backend");
    } finally {
      setLoading(false);
    }
  }, [authToken, filters]);

  // Reload data when authentication status becomes active
  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchAllData();
    }
  }, [isAuthenticated, authToken]);

  const refresh = useCallback(() => {
    return fetchAllData(authToken, filters);
  }, [authToken, filters, fetchAllData]);

  const applyFilters = async (newFilters) => {
    setFilters(newFilters);
    await fetchAllData(authToken, newFilters);
    toast.success("Filters applied");
  };

  const handleCreateVehicle = async (data) => {
    setLoading(true);
    try {
      await createVehicle(authToken, data);
      toast.success("Vehicle registered successfully");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to create vehicle");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVehicleStatus = async (vehicleId, status) => {
    setLoading(true);
    try {
      await updateVehicle(authToken, vehicleId, { status });
      toast.success(`Vehicle status set to ${status}`);
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to update vehicle status");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (data) => {
    setLoading(true);
    try {
      await createDriver(authToken, data);
      toast.success("Driver profile created successfully");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to register driver");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDriverStatus = async (driverId, status) => {
    setLoading(true);
    try {
      await updateDriver(authToken, driverId, { status });
      toast.success(`Driver status set to ${status}`);
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to update driver status");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (data) => {
    setLoading(true);
    try {
      await createTrip(authToken, data);
      toast.success("Trip drafted successfully");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to draft trip");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchTrip = async (tripId) => {
    setLoading(true);
    try {
      await dispatchTrip(authToken, tripId);
      toast.success("Trip dispatched! Status updated to On Trip.");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to dispatch trip");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTrip = async (tripId, data) => {
    setLoading(true);
    try {
      await completeTrip(authToken, tripId, data);
      toast.success("Trip completed successfully. Vehicle and driver set to Available.");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to complete trip");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async (tripId) => {
    setLoading(true);
    try {
      await cancelTrip(authToken, tripId);
      toast.success("Trip cancelled. Statuses restored.");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to cancel trip");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaintenance = async (data) => {
    setLoading(true);
    try {
      await createMaintenance(authToken, data);
      toast.success("Vehicle checked into workshop. Status set to In Shop.");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to register maintenance");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMaintenance = async (maintenanceId, date) => {
    setLoading(true);
    try {
      await closeMaintenance(authToken, maintenanceId, date ? { closedAt: date } : {});
      toast.success("Maintenance closed. Vehicle restored to Available.");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to close maintenance record");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFuelLog = async (data) => {
    setLoading(true);
    try {
      await createFuelLog(authToken, data);
      toast.success("Fuel log added");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to save fuel log");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (data) => {
    setLoading(true);
    try {
      await createExpense(authToken, data);
      toast.success("Expense registered successfully");
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to record expense");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSendLicenseReminders = async (days = 30) => {
    setLoading(true);
    try {
      const res = await sendLicenseReminders(authToken, { withinDays: days });
      toast.success(`License expiry scan run successfully: ${res.sent || 0} alerts sent.`);
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to send reminders");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setLoading(true);
    try {
      const blob = await downloadAnalyticsCsv(authToken, filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transitops-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Analytics CSV exported");
    } catch (error) {
      toast.error(error.message || "CSV download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperationsContext.Provider
      value={{
        loading,
        dashboard,
        analytics,
        vehicles,
        drivers,
        trips,
        maintenance,
        fuelLogs,
        expenses,
        filters,
        applyFilters,
        refresh,
        createVehicle: handleCreateVehicle,
        updateVehicleStatus: handleUpdateVehicleStatus,
        createDriver: handleCreateDriver,
        updateDriverStatus: handleUpdateDriverStatus,
        createTrip: handleCreateTrip,
        dispatchTrip: handleDispatchTrip,
        completeTrip: handleCompleteTrip,
        cancelTrip: handleCancelTrip,
        createMaintenance: handleCreateMaintenance,
        closeMaintenance: handleCloseMaintenance,
        createFuelLog: handleCreateFuelLog,
        createExpense: handleCreateExpense,
        sendLicenseReminders: handleSendLicenseReminders,
        exportCsv: handleExportCsv,
      }}
    >
      {children}
    </OperationsContext.Provider>
  );
};

export const useOperations = () => {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error("useOperations must be used within an OperationsProvider");
  }
  return context;
};
