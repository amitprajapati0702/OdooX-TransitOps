import { z } from "zod";

const vehicleStatus = z.enum(["Available", "On Trip", "In Shop", "Retired"]);
const driverStatus = z.enum(["Available", "On Trip", "Off Duty", "Suspended"]);
const tripStatus = z.enum(["Draft", "Dispatched", "Completed", "Cancelled"]);
const expenseCategory = z.enum(["Fuel", "Maintenance", "Toll", "Parking", "Misc"]);

export const vehicleCreateSchema = z.object({
  registrationNumber: z.string().trim().min(2),
  vehicleNameModel: z.string().trim().min(2),
  type: z.string().trim().min(2),
  maximumLoadCapacityKg: z.coerce.number().positive(),
  odometer: z.coerce.number().nonnegative().default(0),
  acquisitionCost: z.coerce.number().nonnegative(),
  status: vehicleStatus.optional().default("Available"),
  region: z.string().trim().min(1).optional().nullable(),
});

export const vehicleUpdateSchema = z.object({
  vehicleNameModel: z.string().trim().min(2).optional(),
  type: z.string().trim().min(2).optional(),
  maximumLoadCapacityKg: z.coerce.number().positive().optional(),
  odometer: z.coerce.number().nonnegative().optional(),
  acquisitionCost: z.coerce.number().nonnegative().optional(),
  status: vehicleStatus.optional(),
  region: z.string().trim().min(1).optional().nullable(),
});

export const driverCreateSchema = z.object({
  fullName: z.string().trim().min(2),
  licenseNumber: z.string().trim().min(3),
  licenseCategory: z.string().trim().min(1),
  licenseExpiryDate: z.coerce.date(),
  contactNumber: z.string().trim().min(5),
  safetyScore: z.coerce.number().min(0).max(100).default(100),
  status: driverStatus.optional().default("Available"),
  region: z.string().trim().min(1).optional().nullable(),
});

export const driverUpdateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  licenseNumber: z.string().trim().min(3).optional(),
  licenseCategory: z.string().trim().min(1).optional(),
  licenseExpiryDate: z.coerce.date().optional(),
  contactNumber: z.string().trim().min(5).optional(),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
  status: driverStatus.optional(),
  region: z.string().trim().min(1).optional().nullable(),
});

export const tripCreateSchema = z.object({
  source: z.string().trim().min(2),
  destination: z.string().trim().min(2),
  vehicleId: z.coerce.number().int().positive(),
  driverId: z.coerce.number().int().positive(),
  cargoWeightKg: z.coerce.number().positive(),
  plannedDistanceKm: z.coerce.number().positive(),
  revenue: z.coerce.number().nonnegative().default(0),
  region: z.string().trim().min(1).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const tripCompleteSchema = z.object({
  finalOdometer: z.coerce.number().nonnegative(),
  fuelConsumedLiters: z.coerce.number().nonnegative(),
  actualDistanceKm: z.coerce.number().nonnegative().optional(),
  revenue: z.coerce.number().nonnegative().optional(),
});

export const maintenanceCreateSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  maintenanceType: z.string().trim().min(2),
  title: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  cost: z.coerce.number().nonnegative().default(0),
});

export const maintenanceCloseSchema = z.object({
  closedAt: z.coerce.date().optional(),
});

export const fuelLogCreateSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  tripId: z.coerce.number().int().positive().optional().nullable(),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().nonnegative(),
  odometer: z.coerce.number().nonnegative().optional().nullable(),
  loggedAt: z.coerce.date().optional(),
});

export const expenseCreateSchema = z.object({
  vehicleId: z.coerce.number().int().positive().optional().nullable(),
  tripId: z.coerce.number().int().positive().optional().nullable(),
  category: expenseCategory,
  description: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive(),
  occurredAt: z.coerce.date().optional(),
});

export const dashboardQuerySchema = z.object({
  vehicleType: z.string().trim().optional(),
  vehicleStatus: vehicleStatus.optional(),
  region: z.string().trim().optional(),
});

export const analyticsQuerySchema = z.object({
  vehicleType: z.string().trim().optional(),
  region: z.string().trim().optional(),
});