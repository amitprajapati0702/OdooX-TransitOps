import asyncHandler from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { createVehicleDocument, listVehicleDocuments } from "./documents.service.js";

export const uploadVehicleDocumentController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, "File is required."));
  }

  const document = await createVehicleDocument({
    vehicleId: req.body.vehicleId,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    filePath: req.file.path,
    documentType: req.body.documentType,
    uploadedBy: req.user?.user_id,
  });

  return res.status(201).json(new ApiResponse(201, "Vehicle document uploaded successfully.", document));
});

export const listVehicleDocumentsController = asyncHandler(async (req, res) => {
  const documents = await listVehicleDocuments(req.params.vehicleId);

  return res.status(200).json(new ApiResponse(200, "Vehicle documents fetched successfully.", documents));
});