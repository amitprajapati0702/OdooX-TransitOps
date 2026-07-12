import { z } from "zod";

export const uploadVehicleDocumentSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  documentType: z.string().trim().min(2).default("Other"),
});