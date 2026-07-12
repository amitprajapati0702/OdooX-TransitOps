import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import { ROLES } from "../../constants/role.js";
import {
  vehicleCreateSchema,
  vehicleUpdateSchema,
  driverCreateSchema,
  driverUpdateSchema,
  tripCreateSchema,
  tripCompleteSchema,
  maintenanceCreateSchema,
  maintenanceCloseSchema,
  fuelLogCreateSchema,
  expenseCreateSchema,
} from "./operations.validation.js";
import {
  listVehiclesController,
  createVehicleController,
  updateVehicleController,
  listDriversController,
  createDriverController,
  updateDriverController,
  listTripsController,
  createTripController,
  dispatchTripController,
  completeTripController,
  cancelTripController,
  listMaintenanceController,
  createMaintenanceController,
  closeMaintenanceController,
  listFuelLogsController,
  createFuelLogController,
  listExpensesController,
  createExpenseController,
  dashboardController,
  analyticsController,
  exportAnalyticsCsvController,
} from "./operations.controller.js";

const router = Router();

router.use(protect);

const fleetRoles = [ROLES.ADMIN, ROLES.FLEET_MANAGER];
const driverRoles = [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.DRIVER];
const financeRoles = [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST];
const safetyRoles = [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER];
const analyticsRoles = [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST, ROLES.SAFETY_OFFICER];

router.get("/dashboard", authorize(...analyticsRoles), dashboardController);
router.get("/analytics", authorize(...analyticsRoles), analyticsController);
router.get("/analytics/export.csv", authorize(...analyticsRoles), exportAnalyticsCsvController);

router
  .route("/vehicles")
  .get(authorize(...fleetRoles), listVehiclesController)
  .post(authorize(...fleetRoles), validate(vehicleCreateSchema), createVehicleController);

router
  .route("/vehicles/:vehicleId")
  .patch(authorize(...fleetRoles), validate(vehicleUpdateSchema), updateVehicleController);

router
  .route("/drivers")
  .get(authorize(...safetyRoles), listDriversController)
  .post(authorize(...safetyRoles), validate(driverCreateSchema), createDriverController);

router
  .route("/drivers/:driverId")
  .patch(authorize(...safetyRoles), validate(driverUpdateSchema), updateDriverController);

router
  .route("/trips")
  .get(authorize(...driverRoles), listTripsController)
  .post(authorize(...driverRoles), validate(tripCreateSchema), createTripController);

router.post("/trips/:tripId/dispatch", authorize(...driverRoles), dispatchTripController);
router.post("/trips/:tripId/complete", authorize(...driverRoles), validate(tripCompleteSchema), completeTripController);
router.post("/trips/:tripId/cancel", authorize(...driverRoles), cancelTripController);

router
  .route("/maintenance")
  .get(authorize(...fleetRoles), listMaintenanceController)
  .post(authorize(...fleetRoles), validate(maintenanceCreateSchema), createMaintenanceController);

router.post("/maintenance/:maintenanceId/close", authorize(...fleetRoles), validate(maintenanceCloseSchema), closeMaintenanceController);

router
  .route("/fuel-logs")
  .get(authorize(...financeRoles), listFuelLogsController)
  .post(authorize(...financeRoles), validate(fuelLogCreateSchema), createFuelLogController);

router
  .route("/expenses")
  .get(authorize(...financeRoles), listExpensesController)
  .post(authorize(...financeRoles), validate(expenseCreateSchema), createExpenseController);

export default router;