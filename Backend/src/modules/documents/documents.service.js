import pool from "../../config/database.js";
import { ApiError } from "../../errors/ApiError.js";

export const listVehicleDocuments = async (vehicleId) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM vehicle_documents
    WHERE vehicle_id = $1
    ORDER BY uploaded_at DESC;
    `,
    [vehicleId],
  );

  return rows;
};

export const createVehicleDocument = async ({
  vehicleId,
  originalName,
  storedName,
  mimeType,
  fileSize,
  filePath,
  documentType,
  uploadedBy,
}) => {
  const { rows: vehicleRows } = await pool.query(
    `
    SELECT vehicle_id
    FROM vehicles
    WHERE vehicle_id = $1
    LIMIT 1;
    `,
    [vehicleId],
  );

  if (!vehicleRows.length) {
    throw new ApiError(404, "Vehicle not found.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO vehicle_documents (
      vehicle_id,
      original_name,
      stored_name,
      mime_type,
      file_size,
      file_path,
      document_type,
      uploaded_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
    `,
    [
      vehicleId,
      originalName,
      storedName,
      mimeType,
      fileSize,
      filePath,
      documentType,
      uploadedBy ?? null,
    ],
  );

  return rows[0];
};