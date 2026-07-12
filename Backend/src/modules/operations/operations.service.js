import crypto from "crypto";
import pool from "../../config/database.js";
import { ApiError } from "../../errors/ApiError.js";

const vehicleStatuses = ["Available", "On Trip", "In Shop", "Retired"];
const driverStatuses = ["Available", "On Trip", "Off Duty", "Suspended"];

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

const buildVehicleWhereClause = (filters = {}) => {
  const clauses = [];
  const values = [];

  if (filters.vehicleType) {
    values.push(filters.vehicleType);
    clauses.push(`type = $${values.length}`);
  }

  if (filters.vehicleStatus) {
    values.push(filters.vehicleStatus);
    clauses.push(`status = $${values.length}`);
  }

  if (filters.region) {
    values.push(filters.region);
    clauses.push(`region = $${values.length}`);
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

  return rows;
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
      vehicle_name_model,
      type,
      maximum_load_capacity_kg,
      odometer,
      acquisition_cost,
      status,
      region,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      payload.region ?? null,
      payload.createdBy ?? null,
    ],
  );

  return rows[0];
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

  if (!vehicleStatuses.includes(nextStatus)) {
    throw new ApiError(400, "Invalid vehicle status.");
  }

  if (current.status === "On Trip" && nextStatus === "Retired") {
    throw new ApiError(400, "Vehicles on trip cannot be retired.");
  }

  const { rows } = await pool.query(
    `
    UPDATE vehicles
    SET
      vehicle_name_model = COALESCE($2, vehicle_name_model),
      type = COALESCE($3, type),
      maximum_load_capacity_kg = COALESCE($4, maximum_load_capacity_kg),
      odometer = COALESCE($5, odometer),
      acquisition_cost = COALESCE($6, acquisition_cost),
      status = COALESCE($7, status),
      region = COALESCE($8, region),
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
      payload.region ?? null,
    ],
  );

  return rows[0];
};

export const listDrivers = async () => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM drivers
    ORDER BY created_at DESC;
    `,
  );

  return rows;
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
      region,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      payload.region ?? null,
      payload.createdBy ?? null,
    ],
  );

  return rows[0];
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

  const nextStatus = payload.status ?? current.status;

  if (!driverStatuses.includes(nextStatus)) {
    throw new ApiError(400, "Invalid driver status.");
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
      status = COALESCE($8, status),
      region = COALESCE($9, region),
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
      payload.region ?? null,
    ],
  );

  return rows[0];
};

export const listTrips = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      t.*,
      v.registration_number,
      v.vehicle_name_model,
      d.full_name AS driver_name
    FROM trips t
    JOIN vehicles v ON v.vehicle_id = t.vehicle_id
    JOIN drivers d ON d.driver_id = t.driver_id
    ORDER BY t.created_at DESC;
    `,
  );

  return rows;
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

    if (Number(payload.cargoWeightKg) > Number(vehicle.maximum_load_capacity_kg)) {
      throw new ApiError(400, "Cargo weight exceeds vehicle capacity.");
    }

    const tripCode = `TRP-${crypto.randomUUID().split("-")[0].toUpperCase()}`;

    const { rows } = await client.query(
      `
      INSERT INTO trips (
        trip_code,
        source,
        destination,
        vehicle_id,
        driver_id,
        start_odometer,
        cargo_weight_kg,
        planned_distance_km,
        revenue,
        status,
        region,
        notes,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Draft', $10, $11, $12)
      RETURNING *;
      `,
      [
        tripCode,
        payload.source,
        payload.destination,
        payload.vehicleId,
        payload.driverId,
        vehicle.odometer,
        payload.cargoWeightKg,
        payload.plannedDistanceKm,
        payload.revenue ?? 0,
        payload.region ?? null,
        payload.notes ?? null,
        payload.createdBy ?? null,
      ],
    );

    return rows[0];
  });
};

export const dispatchTrip = async (tripId) => {
  return withTransaction(async (client) => {
    const trip = await ensureTrip(client, tripId);

    if (trip.status !== "Draft") {
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

    if (Number(trip.cargo_weight_kg) > Number(vehicle.maximum_load_capacity_kg)) {
      throw new ApiError(400, "Cargo weight exceeds vehicle capacity.");
    }

    await client.query(
      `
      UPDATE trips
      SET status = 'Dispatched', dispatched_at = NOW(), updated_at = NOW()
      WHERE trip_id = $1;
      `,
      [tripId],
    );

    await client.query(
      `
      UPDATE vehicles
      SET status = 'On Trip', updated_at = NOW()
      WHERE vehicle_id = $1;
      `,
      [trip.vehicle_id],
    );

    await client.query(
      `
      UPDATE drivers
      SET status = 'On Trip', updated_at = NOW()
      WHERE driver_id = $1;
      `,
      [trip.driver_id],
    );

    return ensureTrip(client, tripId);
  });
};

export const completeTrip = async (tripId, payload) => {
  return withTransaction(async (client) => {
    const trip = await ensureTrip(client, tripId);

    if (trip.status !== "Dispatched") {
      throw new ApiError(400, "Only dispatched trips can be completed.");
    }

    const actualDistance =
      payload.actualDistanceKm ??
      Number(payload.finalOdometer) - Number(trip.start_odometer);

    await client.query(
      `
      UPDATE trips
      SET
        status = 'Completed',
        final_odometer = $2,
        fuel_consumed_liters = $3,
        actual_distance_km = $4,
        revenue = COALESCE($5, revenue),
        completed_at = NOW(),
        updated_at = NOW()
      WHERE trip_id = $1;
      `,
      [
        tripId,
        payload.finalOdometer,
        payload.fuelConsumedLiters,
        actualDistance,
        payload.revenue ?? null,
      ],
    );

    await client.query(
      `
      UPDATE vehicles
      SET odometer = $2, status = CASE WHEN status = 'Retired' THEN 'Retired' ELSE 'Available' END, updated_at = NOW()
      WHERE vehicle_id = $1;
      `,
      [trip.vehicle_id, payload.finalOdometer],
    );

    await client.query(
      `
      UPDATE drivers
      SET status = 'Available', updated_at = NOW()
      WHERE driver_id = $1 AND status <> 'Suspended';
      `,
      [trip.driver_id],
    );

    return ensureTrip(client, tripId);
  });
};

export const cancelTrip = async (tripId) => {
  return withTransaction(async (client) => {
    const trip = await ensureTrip(client, tripId);

    if (trip.status === "Completed" || trip.status === "Cancelled") {
      throw new ApiError(400, "Trip cannot be cancelled.");
    }

    await client.query(
      `
      UPDATE trips
      SET status = 'Cancelled', cancelled_at = NOW(), updated_at = NOW()
      WHERE trip_id = $1;
      `,
      [tripId],
    );

    if (trip.status === "Dispatched") {
      await client.query(
        `
        UPDATE vehicles
        SET status = CASE WHEN status = 'Retired' THEN 'Retired' ELSE 'Available' END, updated_at = NOW()
        WHERE vehicle_id = $1;
        `,
        [trip.vehicle_id],
      );

      await client.query(
        `
        UPDATE drivers
        SET status = CASE WHEN status = 'Suspended' THEN 'Suspended' ELSE 'Available' END, updated_at = NOW()
        WHERE driver_id = $1;
        `,
        [trip.driver_id],
      );
    }

    return ensureTrip(client, tripId);
  });
};

export const listMaintenanceRecords = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      m.*,
      v.registration_number,
      v.vehicle_name_model
    FROM maintenance_logs m
    JOIN vehicles v ON v.vehicle_id = m.vehicle_id
    ORDER BY m.created_at DESC;
    `,
  );

  return rows;
};

export const createMaintenanceRecord = async (payload) => {
  return withTransaction(async (client) => {
    const vehicle = await ensureVehicle(client, payload.vehicleId);

    if (vehicle.status === "Retired") {
      throw new ApiError(400, "Retired vehicles cannot enter maintenance.");
    }

    const { rows } = await client.query(
      `
      INSERT INTO maintenance_logs (
        vehicle_id,
        maintenance_type,
        title,
        description,
        cost,
        status,
        started_at,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, 'Active', NOW(), $6)
      RETURNING *;
      `,
      [
        payload.vehicleId,
        payload.maintenanceType,
        payload.title,
        payload.description ?? null,
        payload.cost ?? 0,
        payload.createdBy ?? null,
      ],
    );

    await client.query(
      `
      UPDATE vehicles
      SET status = 'In Shop', updated_at = NOW()
      WHERE vehicle_id = $1 AND status <> 'Retired';
      `,
      [payload.vehicleId],
    );

    return rows[0];
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
      return maintenance;
    }

    await client.query(
      `
      UPDATE maintenance_logs
      SET status = 'Closed', closed_at = COALESCE($2, NOW()), updated_at = NOW()
      WHERE maintenance_id = $1;
      `,
      [maintenanceId, payload.closedAt ?? null],
    );

    const vehicle = await ensureVehicle(client, maintenance.vehicle_id);

    await client.query(
      `
      UPDATE vehicles
      SET status = CASE WHEN status = 'Retired' THEN 'Retired' ELSE 'Available' END, updated_at = NOW()
      WHERE vehicle_id = $1;
      `,
      [vehicle.vehicle_id],
    );

    return ensureVehicle(client, maintenance.vehicle_id);
  });
};

export const listFuelLogs = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      f.*,
      v.registration_number,
      t.trip_code
    FROM fuel_logs f
    JOIN vehicles v ON v.vehicle_id = f.vehicle_id
    LEFT JOIN trips t ON t.trip_id = f.trip_id
    ORDER BY f.logged_at DESC;
    `,
  );

  return rows;
};

export const createFuelLog = async (payload) => {
  return withTransaction(async (client) => {
    await ensureVehicle(client, payload.vehicleId);

    if (payload.tripId) {
      const trip = await ensureTrip(client, payload.tripId);

      if (Number(trip.vehicle_id) !== Number(payload.vehicleId)) {
        throw new ApiError(400, "Fuel log trip must belong to the selected vehicle.");
      }
    }

    const { rows } = await client.query(
      `
      INSERT INTO fuel_logs (
        vehicle_id,
        trip_id,
        liters,
        cost,
        odometer,
        logged_at,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7)
      RETURNING *;
      `,
      [
        payload.vehicleId,
        payload.tripId ?? null,
        payload.liters,
        payload.cost,
        payload.odometer ?? null,
        payload.loggedAt ?? null,
        payload.createdBy ?? null,
      ],
    );

    return rows[0];
  });
};

export const listExpenses = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      e.*,
      v.registration_number,
      t.trip_code
    FROM expenses e
    LEFT JOIN vehicles v ON v.vehicle_id = e.vehicle_id
    LEFT JOIN trips t ON t.trip_id = e.trip_id
    ORDER BY e.occurred_at DESC;
    `,
  );

  return rows;
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
      category,
      description,
      amount,
      occurred_at,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7)
    RETURNING *;
    `,
    [
      payload.vehicleId ?? null,
      payload.tripId ?? null,
      payload.category,
      payload.description ?? null,
      payload.amount,
      payload.occurredAt ?? null,
      payload.createdBy ?? null,
    ],
  );

  return rows[0];
};

export const getDashboardSummary = async (filters = {}) => {
  const { clause, values } = buildVehicleWhereClause(filters);
  const { predicate } = buildVehiclePredicate(filters);

  const vehicleStats = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status IN ('Available', 'On Trip')) AS active_vehicles,
      COUNT(*) FILTER (WHERE status = 'Available') AS available_vehicles,
      COUNT(*) FILTER (WHERE status = 'In Shop') AS vehicles_in_maintenance,
      COUNT(*) FILTER (WHERE status = 'Retired') AS retired_vehicles,
      COUNT(*) AS total_vehicles,
      ROUND(
        CASE
          WHEN COUNT(*) FILTER (WHERE status IN ('Available', 'On Trip')) > 0
            THEN 100.0 * COUNT(*) FILTER (WHERE status = 'On Trip') / COUNT(*) FILTER (WHERE status IN ('Available', 'On Trip'))
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
      COUNT(*) FILTER (WHERE t.status = 'Draft') AS pending_trips,
      COUNT(*) FILTER (WHERE t.status = 'Dispatched') AS active_trips,
      COUNT(*) FILTER (WHERE t.status = 'Completed') AS completed_trips,
      COUNT(*) FILTER (WHERE t.status = 'Cancelled') AS cancelled_trips
    FROM trips t
    JOIN vehicles v ON v.vehicle_id = t.vehicle_id
    ${clause.replace(/\bstatus\b/g, 'v.status')};
    `,
    values,
  );

  const driverStats = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'On Trip') AS drivers_on_duty,
      COUNT(*) FILTER (WHERE status = 'Available') AS available_drivers,
      COUNT(*) FILTER (WHERE status = 'Suspended') AS suspended_drivers
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
      ${predicate ? `WHERE m.status = 'Closed' AND ${predicate}` : "WHERE m.status = 'Closed'"}
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
        COALESCE(SUM(actual_distance_km), 0) AS total_distance_km,
        COALESCE(SUM(revenue), 0) AS revenue
      FROM trips
      WHERE status = 'Completed'
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
      WHERE status = 'Closed'
      GROUP BY vehicle_id
    )
    SELECT
      v.vehicle_id,
      v.registration_number,
      v.vehicle_name_model,
      v.type,
      v.region,
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