import { z } from "zod";

export const uploadVehicleDocumentSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  documentType: z.string().trim().min(2).default("Other"),
});