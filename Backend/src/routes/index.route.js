import { Router } from "express";
import authRoutes  from "../modules/auth/auth.route.js";
import operationsRoutes from "../modules/operations/operations.route.js";
import documentsRoutes from "../modules/documents/documents.route.js";
import remindersRoutes from "../modules/reminders/reminders.route.js";


const router = Router();

router.get("/health", (req, res) => {

    res.status(200).json({
        success: true,
        message: "TransitOps API is running."
    });

});
router.use("/auth", authRoutes);
router.use("/operations", operationsRoutes);
router.use("/documents", documentsRoutes);
router.use("/reminders", remindersRoutes);



export default router;