import { Router } from "express";
import authRoutes  from "../modules/auth/auth.route.js";

const router = Router();

router.get("/health", (req, res) => {

    res.status(200).json({
        success: true,
        message: "TransitOps API is running."
    });

});
router.use("/auth", authRoutes);

export default router;