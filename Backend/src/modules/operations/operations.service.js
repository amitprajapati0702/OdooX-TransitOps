import crypto from "crypto";
import pool from "../../config/database.js";
import { ApiError } from "../../errors/ApiError.js";

const toDate = (value) => (value ? new Date(value) : null);

const isExpired = (dateValue) => {
  if (!dateValue) {
    return true;
  }
  return new Date(dateValue).getTime() < Date.now();
};

const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Response mapping helper for Vehicles table (translates DB columns back to UI response contracts)
const mapVehicleDbToResponse = (row) => {
  if (!row) return null;
  return {
    ...row,
    vehicle_name_model: row.vehicle_name,
    type: row.vehicle_type,
    maximum_load_capacity_kg: row.maximum_load_capacity,
    region: null, // table doesn't have region column in DDL
  };
};

// Response mapping helper for Drivers table
const mapDriverDbToResponse = (row) => {
  if (!row) return null;
  return {
    ...row,
    region: null, // table doesn't have region column in DDL
  };
};

// Response mapping for Trips table (maps trip_number -> trip_code, trip_status -> status, etc.)
const mapTripDbToResponse = (row) => {
  if (!row) return null;
  return {
    ...row,
    trip_code: row.trip_number,
    start_odometer: row.initial_odometer,
    cargo_weight_kg: row.cargo_weight,
    planned_distance_km: row.planned_distance,
    actual_distance_km: row.actual_distance,
    revenue: row.trip_status === "Completed" ? row.actual_revenue : row.estimated_revenue,
    status: row.trip_status,
    notes: row.remarks,
    region: null,
  };
};

// Response mapping for Maintenance table
const mapMaintenanceDbToResponse = (row) => {
  if (!row) return null;
  const desc = row.description || "";
  const parts = desc.split(" - ");
  return {
    ...row,
    title: parts[0] || "",
    description: parts.slice(1).join(" - ") || null,
    status: row.status === "Open" ? "Active" : row.status,
    started_at: row.start_date,
    closed_at: row.end_date,
  };
};

// Response mapping for Fuel Logs table
const mapFuelLogDbToResponse = (row) => {
  if (!row) return null;
  return {
    ...row,
    logged_at: row.fuel_date,
  };
};

// Response mapping for Expenses table
const mapExpenseDbToResponse = (row) => {
  if (!row) return null;
  return {
    ...row,
    category: row.expense_type,
    occurred_at: row.expense_date,
  };
};

const ensureVehicle = async (client, vehicleId) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM vehicles
    WHERE vehicle_id = $1
    LIMIT 1;
    `,
    [vehicleId],
  );

  const vehicle = rows[0];
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found.");
  }
  return vehicle;
};

const ensureDriver = async (client, driverId) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM drivers
    WHERE driver_id = $1
    LIMIT 1;
    `,
    [driverId],
  );

  const driver = rows[0];
  if (!driver) {
    throw new ApiError(404, "Driver not found.");
  }
  return driver;
};

const ensureTrip = async (client, tripId) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM trips
    WHERE trip_id = $1
    LIMIT 1;
    `,
    [tripId],
  );

  const trip = rows[0];
  if (!trip) {
    throw new ApiError(404, "Trip not found.");
  }
  return trip;
};

// Builds filters for vehicle listing
const buildVehicleWhereClause = (filters = {}) => {
  const clauses = [];
  const values = [];

  if (filters.vehicleType) {
    values.push(filters.vehicleType);
    clauses.push(`vehicle_type = $${values.length}`);
  }

  if (filters.vehicleStatus) {
    values.push(filters.vehicleStatus);
    clauses.push(`status = $${values.length}`);
  }

  return {
    clause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
};

const buildVehiclePredicate = (filters = {}) => {
  const { clause, values } = buildVehicleWhereClause(filters);
  return {
    predicate: clause ? clause.replace(/^WHERE\s+/i, "").replace(/\bstatus\b/g, "v.status") : "",
    values,
  };
};

export const listVehicles = async (filters = {}) => {
  const { clause, values } = buildVehicleWhereClause(filters);

  const { rows } = await pool.query(
    `
    SELECT *
    FROM vehicles
    ${clause}
    ORDER BY created_at DESC;
    `,
    values,
  );

  return rows.map(mapVehicleDbToResponse);
};

export const createVehicle = async (payload) => {
  const { rows: existing } = await pool.query(
    `
    SELECT vehicle_id
    FROM vehicles
    WHERE registration_number = $1
    LIMIT 1;
    `,
    [payload.registrationNumber],
  );

  if (existing.length) {
    throw new ApiError(409, "Vehicle registration number must be unique.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO vehicles (
      registration_number,
      vehicle_name,
      vehicle_type,
      maximum_load_capacity,
      odometer,
      acquisition_cost,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::vehicle_status)
    RETURNING *;
    `,
    [
      payload.registrationNumber,
      payload.vehicleNameModel,
      payload.type,
      payload.maximumLoadCapacityKg,
      payload.odometer ?? 0,
      payload.acquisitionCost,
      payload.status ?? "Available",
    ],
  );

  return mapVehicleDbToResponse(rows[0]);
};

export const updateVehicle = async (vehicleId, payload) => {
  const { rows: currentRows } = await pool.query(
    `
    SELECT *
    FROM vehicles
    WHERE vehicle_id = $1
    LIMIT 1;
    `,
    [vehicleId],
  );

  const current = currentRows[0];
  if (!current) {
    throw new ApiError(404, "Vehicle not found.");
  }

  const nextStatus = payload.status ?? current.status;
  if (current.status === "On Trip" && nextStatus === "Retired") {
    throw new ApiError(400, "Vehicles on trip cannot be retired.");
  }

  const { rows } = await pool.query(
    `
    UPDATE vehicles
    SET
      vehicle_name = COALESCE($2, vehicle_name),
      vehicle_type = COALESCE($3, vehicle_type),
      maximum_load_capacity = COALESCE($4, maximum_load_capacity),
      odometer = COALESCE($5, odometer),
      acquisition_cost = COALESCE($6, acquisition_cost),
      status = COALESCE($7, status)::vehicle_status,
      updated_at = NOW()
    WHERE vehicle_id = $1
    RETURNING *;
    `,
    [
      vehicleId,
      payload.vehicleNameModel ?? null,
      payload.type ?? null,
      payload.maximumLoadCapacityKg ?? null,
      payload.odometer ?? null,
      payload.acquisitionCost ?? null,
      payload.status ?? null,
    ],
  );

  return mapVehicleDbToResponse(rows[0]);
};

export const listDrivers = async () => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM drivers
    ORDER BY created_at DESC;
    `,
  );

  return rows.map(mapDriverDbToResponse);
};

export const createDriver = async (payload) => {
  const { rows: existing } = await pool.query(
    `
    SELECT driver_id
    FROM drivers
    WHERE license_number = $1
    LIMIT 1;
    `,
    [payload.licenseNumber],
  );

  if (existing.length) {
    throw new ApiError(409, "Driver license number must be unique.");
  }

  // Auto-generate employee code for drivers table constraint
  const employeeCode = `EMP-${crypto.randomUUID().split("-")[0].toUpperCase()}`;

  const { rows } = await pool.query(
    `
    INSERT INTO drivers (
      full_name,
      license_number,
      license_category,
      license_expiry_date,
      contact_number,
      safety_score,
      status,
      employee_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::driver_status, $8)
    RETURNING *;
    `,
    [
      payload.fullName,
      payload.licenseNumber,
      payload.licenseCategory,
      payload.licenseExpiryDate,
      payload.contactNumber,
      payload.safetyScore ?? 100,
      payload.status ?? "Available",
      employeeCode,
    ],
  );

  return mapDriverDbToResponse(rows[0]);
};

export const updateDriver = async (driverId, payload) => {
  const { rows: currentRows } = await pool.query(
    `
    SELECT *
    FROM drivers
    WHERE driver_id = $1
    LIMIT 1;
    `,
    [driverId],
  );

  const current = currentRows[0];
  if (!current) {
    throw new ApiError(404, "Driver not found.");
  }

  const { rows } = await pool.query(
    `
    UPDATE drivers
    SET
      full_name = COALESCE($2, full_name),
      license_number = COALESCE($3, license_number),
      license_category = COALESCE($4, license_category),
      license_expiry_date = COALESCE($5, license_expiry_date),
      contact_number = COALESCE($6, contact_number),
      safety_score = COALESCE($7, safety_score),
      status = COALESCE($8, status)::driver_status,
      updated_at = NOW()
    WHERE driver_id = $1
    RETURNING *;
    `,
    [
      driverId,
      payload.fullName ?? null,
      payload.licenseNumber ?? null,
      payload.licenseCategory ?? null,
      payload.licenseExpiryDate ?? null,
      payload.contactNumber ?? null,
      payload.safetyScore ?? null,
      payload.status ?? null,
    ],
  );

  return mapDriverDbToResponse(rows[0]);
};

export const listTrips = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      t.*,
      v.registration_number,
      v.vehicle_name,
      v.vehicle_name AS vehicle_name_model,
      d.full_name AS driver_name
    FROM trips t
    JOIN vehicles v ON v.vehicle_id = t.vehicle_id
    JOIN drivers d ON d.driver_id = t.driver_id
    ORDER BY t.created_at DESC;
    `,
  );

  return rows.map(mapTripDbToResponse);
};

export const createTrip = async (payload) => {
  return withTransaction(async (client) => {
    const vehicle = await ensureVehicle(client, payload.vehicleId);
    const driver = await ensureDriver(client, payload.driverId);

    if (vehicle.status === "Retired" || vehicle.status === "In Shop") {
      throw new ApiError(400, "Vehicle is not available for dispatch selection.");
    }

    if (vehicle.status === "On Trip") {
      throw new ApiError(400, "Vehicle is already on a trip.");
    }

    if (driver.status === "Suspended" || driver.status === "On Trip") {
      throw new ApiError(400, "Driver is not available for dispatch selection.");
    }

    if (isExpired(driver.license_expiry_date)) {
      throw new ApiError(400, "Driver license has expired.");
    }

    if (Number(payload.cargoWeightKg) > Number(vehicle.maximum_load_capacity)) {
      throw new ApiError(400, "Cargo weight exceeds vehicle capacity.");
    }

    const tripNumber = `TRP-${crypto.randomUUID().split("-")[0].toUpperCase()}`;

    const { rows } = await client.query(
      `
      INSERT INTO trips (
        trip_number,
        source,
        destination,
        vehicle_id,
        driver_id,
        initial_odometer,
        cargo_weight,
        planned_distance,
        estimated_revenue,
        trip_status,
        remarks,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Draft'::trip_status, $10, $11)
      RETURNING *;
      `,
      [
        tripNumber,
        payload.source,
        payload.destination,
        payload.vehicleId,
        payload.driverId,
        vehicle.odometer,
        payload.cargoWeightKg,
        payload.plannedDistanceKm,
        payload.revenue ?? 0,
        payload.notes ?? null,
        payload.createdBy ?? null,
      ],
    );

    return mapTripDbToResponse(rows[0]);
  });
};

export const dispatchTrip = async (tripId) => {
  return withTransaction(async (client) => {
    const trip = await ensureTrip(client, tripId);

    if (trip.trip_status !== "Draft") {
      throw new ApiError(400, "Only draft trips can be dispatched.");
    }

    const vehicle = await ensureVehicle(client, trip.vehicle_id);
    const driver = await ensureDriver(client, trip.driver_id);

    if (vehicle.status === "Retired" || vehicle.status === "In Shop") {
      throw new ApiError(400, "Vehicle is not available for dispatch selection.");
    }

    if (vehicle.status === "On Trip") {
      throw new ApiError(400, "Vehicle is already on a trip.");
    }

    if (driver.status === "Suspended" || driver.status === "On Trip") {
      throw new ApiError(400, "Driver is not available for dispatch selection.");
    }

    if (isExpired(driver.license_expiry_date)) {
      throw new ApiError(400, "Driver license has expired.");
    }

    if (Number(trip.cargo_weight) > Number(vehicle.maximum_load_capacity)) {
      throw new ApiError(400, "Cargo weight exceeds vehicle capacity.");
    }

    await client.query(
      `
      UPDATE trips
      SET trip_status = 'Dispatched'::trip_status, dispatch_time = NOW()
      WHERE trip_id = $1;
      `,
      [tripId],
    );

    await client.query(
      `
      UPDATE vehicles
      SET status = 'On Trip'::vehicle_status, updated_at = NOW()
      WHERE vehicle_id = $1;
      `,
      [trip.vehicle_id],
    );

    await client.query(
      `
      UPDATE drivers
      SET status = 'On Trip'::driver_status, updated_at = NOW()
      WHERE driver_id = $1;
      `,
      [trip.driver_id],
    );

    const updated = await ensureTrip(client, tripId);
    return mapTripDbToResponse(updated);
  });
};

export const completeTrip = async (tripId, payload) => {
  return withTransaction(async (client) => {
    const trip = await ensureTrip(client, tripId);

    if (trip.trip_status !== "Dispatched") {
      throw new ApiError(400, "Only dispatched trips can be completed.");
    }

    const actualDistance =
      payload.actualDistanceKm ??
      Number(payload.finalOdometer) - Number(trip.initial_odometer);

    await client.query(
      `
      UPDATE trips
      SET
        trip_status = 'Completed'::trip_status,
        final_odometer = $2,
        actual_distance = $3,
        actual_revenue = COALESCE($4, estimated_revenue),
        end_time = NOW()
      WHERE trip_id = $1;
      `,
      [
        tripId,
        payload.finalOdometer,
        actualDistance,
        payload.revenue ?? null,
      ],
    );

    await client.query(
      `
      UPDATE vehicles
      SET odometer = $2, status = CASE WHEN status = 'Retired'::vehicle_status THEN 'Retired'::vehicle_status ELSE 'Available'::vehicle_status END, updated_at = NOW()
      WHERE vehicle_id = $1;
      `,
      [trip.vehicle_id, payload.finalOdometer],
    );

    await client.query(
      `
      UPDATE drivers
      SET status = 'Available'::driver_status, updated_at = NOW()
      WHERE driver_id = $1 AND status <> 'Suspended'::driver_status;
      `,
      [trip.driver_id],
    );

    // Record automatically calculated fuel details as an expense entry if complete provides fuel consumed
    if (payload.fuelConsumedLiters && Number(payload.fuelConsumedLiters) > 0) {
      const fuelCost = Number(payload.fuelConsumedLiters) * 1.5; // estimated fuel price
      await client.query(
        `
        INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, odometer, fuel_date)
        VALUES ($1, $2, $3, $4, $5, CURRENT_DATE);
        `,
        [trip.vehicle_id, tripId, payload.fuelConsumedLiters, fuelCost, payload.finalOdometer]
      );
      
      await client.query(
        `
        INSERT INTO expenses (vehicle_id, trip_id, expense_type, amount, expense_date, description)
        VALUES ($1, $2, 'Fuel'::expense_type, $3, CURRENT_DATE, 'Auto-generated Fuel Expense from Trip Completion');
        `,
        [trip.vehicle_id, tripId, fuelCost]
      );
    }

    const updated = await ensureTrip(client, tripId);
    return mapTripDbToResponse(updated);
  });
};

export const cancelTrip = async (tripId) => {
  return withTransaction(async (client) => {
    const trip = await ensureTrip(client, tripId);

    if (trip.trip_status === "Completed" || trip.trip_status === "Cancelled") {
      throw new ApiError(400, "Trip cannot be cancelled.");
    }

    await client.query(
      `
      UPDATE trips
      SET trip_status = 'Cancelled'::trip_status, end_time = NOW()
      WHERE trip_id = $1;
      `,
      [tripId],
    );

    if (trip.trip_status === "Dispatched") {
      await client.query(
        `
        UPDATE vehicles
        SET status = CASE WHEN status = 'Retired'::vehicle_status THEN 'Retired'::vehicle_status ELSE 'Available'::vehicle_status END, updated_at = NOW()
        WHERE vehicle_id = $1;
        `,
        [trip.vehicle_id],
      );

      await client.query(
        `
        UPDATE drivers
        SET status = CASE WHEN status = 'Suspended'::driver_status THEN 'Suspended'::driver_status ELSE 'Available'::driver_status END, updated_at = NOW()
        WHERE driver_id = $1;
        `,
        [trip.driver_id],
      );
    }

    const updated = await ensureTrip(client, tripId);
    return mapTripDbToResponse(updated);
  });
};

export const listMaintenanceRecords = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      m.*,
      v.registration_number,
      v.vehicle_name AS vehicle_name_model
    FROM maintenance_logs m
    JOIN vehicles v ON v.vehicle_id = m.vehicle_id
    ORDER BY m.created_at DESC;
    `,
  );

  return rows.map(mapMaintenanceDbToResponse);
};

export const createMaintenanceRecord = async (payload) => {
  return withTransaction(async (client) => {
    const vehicle = await ensureVehicle(client, payload.vehicleId);

    if (vehicle.status === "Retired") {
      throw new ApiError(400, "Retired vehicles cannot enter maintenance.");
    }

    // Map React client "title" & "description" fields into PostgreSQL description
    const fullDescription = `${payload.title}${payload.description ? " - " + payload.description : ""}`;

    const { rows } = await client.query(
      `
      INSERT INTO maintenance_logs (
        vehicle_id,
        maintenance_type,
        description,
        cost,
        status,
        start_date,
        created_by
      )
      VALUES ($1, $2, $3, $4, 'Open'::maintenance_status, CURRENT_DATE, $5)
      RETURNING *;
      `,
      [
        payload.vehicleId,
        payload.maintenanceType,
        fullDescription,
        payload.cost ?? 0,
        payload.createdBy ?? null,
      ],
    );

    await client.query(
      `
      UPDATE vehicles
      SET status = 'In Shop'::vehicle_status, updated_at = NOW()
      WHERE vehicle_id = $1 AND status <> 'Retired'::vehicle_status;
      `,
      [payload.vehicleId],
    );

    // Save maintenance expense transaction for operational cost calculation
    await client.query(
      `
      INSERT INTO expenses (vehicle_id, expense_type, amount, expense_date, description, created_by)
      VALUES ($1, 'Maintenance'::expense_type, $2, CURRENT_DATE, $3, $4);
      `,
      [payload.vehicleId, payload.cost ?? 0, `Maintenance Ticket: ${payload.title}`, payload.createdBy ?? null]
    );

    return mapMaintenanceDbToResponse(rows[0]);
  });
};

export const closeMaintenanceRecord = async (maintenanceId, payload = {}) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `
      SELECT *
      FROM maintenance_logs
      WHERE maintenance_id = $1
      LIMIT 1;
      `,
      [maintenanceId],
    );

    const maintenance = rows[0];
    if (!maintenance) {
      throw new ApiError(404, "Maintenance record not found.");
    }

    if (maintenance.status === "Closed") {
      return mapMaintenanceDbToResponse(maintenance);
    }

    await client.query(
      `
      UPDATE maintenance_logs
      SET status = 'Closed'::maintenance_status, end_date = COALESCE($2, CURRENT_DATE)
      WHERE maintenance_id = $1;
      `,
      [maintenanceId, payload.closedAt ? new Date(payload.closedAt) : null],
    );

    const vehicle = await ensureVehicle(client, maintenance.vehicle_id);

    await client.query(
      `
      UPDATE vehicles
      SET status = CASE WHEN status = 'Retired'::vehicle_status THEN 'Retired'::vehicle_status ELSE 'Available'::vehicle_status END, updated_at = NOW()
      WHERE vehicle_id = $1;
      `,
      [vehicle.vehicle_id],
    );

    const updated = await client.query(
      `
      SELECT * FROM maintenance_logs WHERE maintenance_id = $1;
      `,
      [maintenanceId]
    );

    return mapMaintenanceDbToResponse(updated.rows[0]);
  });
};

export const listFuelLogs = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      f.*,
      v.registration_number,
      t.trip_number AS trip_code
    FROM fuel_logs f
    JOIN vehicles v ON v.vehicle_id = f.vehicle_id
    LEFT JOIN trips t ON t.trip_id = f.trip_id
    ORDER BY f.created_at DESC;
    `,
  );

  return rows.map(mapFuelLogDbToResponse);
};

export const createFuelLog = async (payload) => {
  return withTransaction(async (client) => {
    await ensureVehicle(client, payload.vehicleId);

    if (payload.tripId) {
      const trip = await ensureTrip(client, payload.tripId);
      if (trip.vehicle_id !== payload.vehicleId) {
        throw new ApiError(400, "Fuel log trip must belong to the selected vehicle.");
      }
    }

    const pricePerLiter = payload.liters > 0 ? (payload.cost / payload.liters) : 0;

    const { rows } = await client.query(
      `
      INSERT INTO fuel_logs (
        vehicle_id,
        trip_id,
        liters,
        cost,
        price_per_liter,
        odometer,
        fuel_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_DATE))
      RETURNING *;
      `,
      [
        payload.vehicleId,
        payload.tripId ?? null,
        payload.liters,
        payload.cost,
        pricePerLiter,
        payload.odometer ?? null,
        payload.loggedAt ? new Date(payload.loggedAt) : null,
      ],
    );

    // Save fuel refill as an expense transaction for calculations
    await client.query(
      `
      INSERT INTO expenses (vehicle_id, trip_id, expense_type, amount, expense_date, description, created_by)
      VALUES ($1, $2, 'Fuel'::expense_type, $3, COALESCE($4, CURRENT_DATE), $5, $6);
      `,
      [
        payload.vehicleId, 
        payload.tripId ?? null, 
        payload.cost, 
        payload.loggedAt ? new Date(payload.loggedAt) : null, 
        `Fuel Fill: ${payload.liters}L`, 
        payload.createdBy ?? null
      ]
    );

    return mapFuelLogDbToResponse(rows[0]);
  });
};

export const listExpenses = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      e.*,
      e.expense_type AS category,
      e.expense_date AS occurred_at,
      v.registration_number,
      t.trip_number AS trip_code
    FROM expenses e
    LEFT JOIN vehicles v ON v.vehicle_id = e.vehicle_id
    LEFT JOIN trips t ON t.trip_id = e.trip_id
    ORDER BY e.created_at DESC;
    `,
  );

  return rows.map(mapExpenseDbToResponse);
};

export const createExpense = async (payload) => {
  if (payload.vehicleId) {
    const { rows } = await pool.query(
      `
      SELECT vehicle_id
      FROM vehicles
      WHERE vehicle_id = $1
      LIMIT 1;
      `,
      [payload.vehicleId],
    );
    if (!rows.length) {
      throw new ApiError(404, "Vehicle not found.");
    }
  }

  if (payload.tripId) {
    const { rows } = await pool.query(
      `
      SELECT trip_id
      FROM trips
      WHERE trip_id = $1
      LIMIT 1;
      `,
      [payload.tripId],
    );
    if (!rows.length) {
      throw new ApiError(404, "Trip not found.");
    }
  }

  const { rows } = await pool.query(
    `
    INSERT INTO expenses (
      vehicle_id,
      trip_id,
      expense_type,
      description,
      amount,
      expense_date,
      created_by
    )
    VALUES ($1, $2, $3::expense_type, $4, $5, COALESCE($6, CURRENT_DATE), $7)
    RETURNING *;
    `,
    [
      payload.vehicleId ?? null,
      payload.tripId ?? null,
      payload.category,
      payload.description ?? null,
      payload.amount,
      payload.occurredAt ? new Date(payload.occurredAt) : null,
      payload.createdBy ?? null,
    ],
  );

  return mapExpenseDbToResponse(rows[0]);
};

export const getDashboardSummary = async (filters = {}) => {
  const { clause, values } = buildVehicleWhereClause(filters);
  const { predicate } = buildVehiclePredicate(filters);

  const vehicleStats = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status IN ('Available'::vehicle_status, 'On Trip'::vehicle_status)) AS active_vehicles,
      COUNT(*) FILTER (WHERE status = 'Available'::vehicle_status) AS available_vehicles,
      COUNT(*) FILTER (WHERE status = 'In Shop'::vehicle_status) AS vehicles_in_maintenance,
      COUNT(*) FILTER (WHERE status = 'Retired'::vehicle_status) AS retired_vehicles,
      COUNT(*) AS total_vehicles,
      ROUND(
        CASE
          WHEN COUNT(*) FILTER (WHERE status IN ('Available'::vehicle_status, 'On Trip'::vehicle_status)) > 0
            THEN 100.0 * COUNT(*) FILTER (WHERE status = 'On Trip'::vehicle_status) / COUNT(*) FILTER (WHERE status IN ('Available'::vehicle_status, 'On Trip'::vehicle_status))
          ELSE 0
        END,
        2
      ) AS fleet_utilization_pct
    FROM vehicles
    ${clause};
    `,
    values,
  );

  const tripStats = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE t.trip_status = 'Draft'::trip_status) AS pending_trips,
      COUNT(*) FILTER (WHERE t.trip_status = 'Dispatched'::trip_status) AS active_trips,
      COUNT(*) FILTER (WHERE t.trip_status = 'Completed'::trip_status) AS completed_trips,
      COUNT(*) FILTER (WHERE t.trip_status = 'Cancelled'::trip_status) AS cancelled_trips
    FROM trips t
    JOIN vehicles v ON v.vehicle_id = t.vehicle_id
    ${clause.replace(/\bstatus\b/g, 'v.status')};
    `,
    values,
  );

  const driverStats = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'On Trip'::driver_status) AS drivers_on_duty,
      COUNT(*) FILTER (WHERE status = 'Available'::driver_status) AS available_drivers,
      COUNT(*) FILTER (WHERE status = 'Suspended'::driver_status) AS suspended_drivers
    FROM drivers;
    `,
  );

  const costStats = await pool.query(
    `
    WITH fuel_costs AS (
      SELECT COALESCE(SUM(cost), 0) AS fuel_cost
      FROM fuel_logs f
      JOIN vehicles v ON v.vehicle_id = f.vehicle_id
      ${predicate ? `WHERE ${predicate}` : ""}
    ),
    maintenance_costs AS (
      SELECT COALESCE(SUM(m.cost), 0) AS maintenance_cost
      FROM maintenance_logs m
      JOIN vehicles v ON v.vehicle_id = m.vehicle_id
      ${predicate ? `WHERE m.status = 'Closed'::maintenance_status AND ${predicate}` : "WHERE m.status = 'Closed'::maintenance_status"}
    )
    SELECT
      fuel_cost,
      maintenance_cost,
      fuel_cost + maintenance_cost AS total_operational_cost
    FROM fuel_costs, maintenance_costs;
    `,
    values,
  );

  return {
    ...vehicleStats.rows[0],
    ...tripStats.rows[0],
    ...driverStats.rows[0],
    ...costStats.rows[0],
  };
};

export const getAnalyticsSummary = async (filters = {}) => {
  const { clause, values } = buildVehicleWhereClause(filters);

  const { rows } = await pool.query(
    `
    WITH trip_stats AS (
      SELECT
        vehicle_id,
        COALESCE(SUM(actual_distance), 0) AS total_distance_km,
        COALESCE(SUM(actual_revenue), 0) AS revenue
      FROM trips
      WHERE trip_status = 'Completed'::trip_status
      GROUP BY vehicle_id
    ),
    fuel_stats AS (
      SELECT
        vehicle_id,
        COALESCE(SUM(liters), 0) AS fuel_liters,
        COALESCE(SUM(cost), 0) AS fuel_cost
      FROM fuel_logs
      GROUP BY vehicle_id
    ),
    maintenance_stats AS (
      SELECT
        vehicle_id,
        COALESCE(SUM(cost), 0) AS maintenance_cost
      FROM maintenance_logs
      WHERE status = 'Closed'::maintenance_status
      GROUP BY vehicle_id
    )
    SELECT
      v.vehicle_id,
      v.registration_number,
      v.vehicle_name AS vehicle_name_model,
      v.vehicle_type AS type,
      NULL AS region,
      v.status,
      v.acquisition_cost,
      COALESCE(ts.total_distance_km, 0) AS total_distance_km,
      COALESCE(fs.fuel_liters, 0) AS fuel_liters,
      CASE
        WHEN COALESCE(fs.fuel_liters, 0) > 0 THEN ROUND(COALESCE(ts.total_distance_km, 0) / fs.fuel_liters, 2)
        ELSE 0
      END AS fuel_efficiency,
      COALESCE(ts.revenue, 0) AS revenue,
      COALESCE(fs.fuel_cost, 0) AS fuel_cost,
      COALESCE(ms.maintenance_cost, 0) AS maintenance_cost,
      COALESCE(fs.fuel_cost, 0) + COALESCE(ms.maintenance_cost, 0) AS operational_cost,
      CASE
        WHEN v.acquisition_cost > 0 THEN
          ROUND(
            (
              COALESCE(ts.revenue, 0) - (COALESCE(fs.fuel_cost, 0) + COALESCE(ms.maintenance_cost, 0))
            ) / v.acquisition_cost,
            4
          )
        ELSE 0
      END AS roi
    FROM vehicles v
    LEFT JOIN trip_stats ts ON ts.vehicle_id = v.vehicle_id
    LEFT JOIN fuel_stats fs ON fs.vehicle_id = v.vehicle_id
    LEFT JOIN maintenance_stats ms ON ms.vehicle_id = v.vehicle_id
    ${clause}
    ORDER BY v.registration_number;
    `,
    values,
  );

  return rows;
};

export const exportAnalyticsCsv = async (filters = {}) => {
  const rows = await getAnalyticsSummary(filters);

  const headers = [
    "vehicle_id",
    "registration_number",
    "vehicle_name_model",
    "type",
    "region",
    "status",
    "acquisition_cost",
    "total_distance_km",
    "fuel_liters",
    "fuel_efficiency",
    "revenue",
    "fuel_cost",
    "maintenance_cost",
    "operational_cost",
    "roi",
  ];

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) {
      return "";
    }
    const text = String(value).replace(/"/g, '""');
    return /[",\n]/.test(text) ? `"${text}"` : text;
  };

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ];

  return csvLines.join("\n");
};