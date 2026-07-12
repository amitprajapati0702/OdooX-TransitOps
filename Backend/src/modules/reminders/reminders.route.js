import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import { ROLES } from "../../constants/role.js";
import { listExpiringDriversController, sendLicenseRemindersController } from "./reminders.controller.js";

const router = Router();

router.use(protect);

router.get("/license-expiry", authorize(ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER), listExpiringDriversController);
router.post("/license-expiry/send", authorize(ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER), sendLicenseRemindersController);

export default router;