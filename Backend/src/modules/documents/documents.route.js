import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import { ROLES } from "../../constants/role.js";
import { uploadVehicleDocumentSchema } from "./documents.validation.js";
import { uploadVehicleDocumentController, listVehicleDocumentsController } from "./documents.controller.js";

const router = Router();
const uploadDir = path.resolve("uploads/vehicle-documents");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

router.use(protect);

router.get(
  "/vehicles/:vehicleId",
  authorize(ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER),
  listVehicleDocumentsController,
);

router.post(
  "/vehicles/upload",
  authorize(ROLES.ADMIN, ROLES.FLEET_MANAGER),
  upload.single("file"),
  validate(uploadVehicleDocumentSchema),
  uploadVehicleDocumentController,
);

export default router;