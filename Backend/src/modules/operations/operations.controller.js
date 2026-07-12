import asyncHandler from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createVehicle,
  listVehicles,
  updateVehicle,
  createDriver,
  listDrivers,
  updateDriver,
  createTrip,
  listTrips,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  createMaintenanceRecord,
  listMaintenanceRecords,
  closeMaintenanceRecord,
  createFuelLog,
  listFuelLogs,
  createExpense,
  listExpenses,
  getDashboardSummary,
  getAnalyticsSummary,
  exportAnalyticsCsv,
} from "./operations.service.js";

const wrap = (serviceFn, statusCode = 200, message = "OK") =>
  asyncHandler(async (req, res) => {
    const data = await serviceFn(req);

    return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
  });

export const listVehiclesController = wrap((req) => listVehicles(req.query), 200, "Vehicles fetched successfully.");
export const createVehicleController = wrap((req) => createVehicle({ ...req.body, createdBy: req.user?.user_id }), 201, "Vehicle created successfully.");
export const updateVehicleController = wrap((req) => updateVehicle(req.params.vehicleId, req.body), 200, "Vehicle updated successfully.");

export const listDriversController = wrap(() => listDrivers(), 200, "Drivers fetched successfully.");
export const createDriverController = wrap((req) => createDriver({ ...req.body, createdBy: req.user?.user_id }), 201, "Driver created successfully.");
export const updateDriverController = wrap((req) => updateDriver(req.params.driverId, req.body), 200, "Driver updated successfully.");

export const listTripsController = wrap(() => listTrips(), 200, "Trips fetched successfully.");
export const createTripController = wrap((req) => createTrip({ ...req.body, createdBy: req.user?.user_id }), 201, "Trip created successfully.");
export const dispatchTripController = wrap((req) => dispatchTrip(req.params.tripId), 200, "Trip dispatched successfully.");
export const completeTripController = wrap((req) => completeTrip(req.params.tripId, req.body), 200, "Trip completed successfully.");
export const cancelTripController = wrap((req) => cancelTrip(req.params.tripId), 200, "Trip cancelled successfully.");

export const listMaintenanceController = wrap(() => listMaintenanceRecords(), 200, "Maintenance records fetched successfully.");
export const createMaintenanceController = wrap((req) => createMaintenanceRecord({ ...req.body, createdBy: req.user?.user_id }), 201, "Maintenance record created successfully.");
export const closeMaintenanceController = wrap((req) => closeMaintenanceRecord(req.params.maintenanceId, req.body), 200, "Maintenance record closed successfully.");

export const listFuelLogsController = wrap(() => listFuelLogs(), 200, "Fuel logs fetched successfully.");
export const createFuelLogController = wrap((req) => createFuelLog({ ...req.body, createdBy: req.user?.user_id }), 201, "Fuel log created successfully.");

export const listExpensesController = wrap(() => listExpenses(), 200, "Expenses fetched successfully.");
export const createExpenseController = wrap((req) => createExpense({ ...req.body, createdBy: req.user?.user_id }), 201, "Expense created successfully.");

export const dashboardController = wrap((req) => getDashboardSummary(req.query), 200, "Dashboard summary fetched successfully.");
export const analyticsController = wrap((req) => getAnalyticsSummary(req.query), 200, "Analytics fetched successfully.");

export const exportAnalyticsCsvController = asyncHandler(async (req, res) => {
  const csv = await exportAnalyticsCsv(req.query);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="transitops-analytics.csv"');

  return res.status(200).send(csv);
});